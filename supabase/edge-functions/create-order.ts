import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Input sanitization helpers
function sanitizeString(str: string | undefined, maxLength: number = 100): string {
  if (!str) return ''
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '') // Basic XSS prevention
}

function sanitizeEmail(email: string | undefined): string {
  if (!email) return ''
  const trimmed = email.trim().toLowerCase()
  // Basic email validation regex
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Invalid email format')
  }
  return trimmed
}

function sanitizePhone(phone: string | undefined): string {
  if (!phone) return ''
  // Remove non-numeric characters except + at start
  const cleaned = phone.trim().replace(/[^\d+]/g, '')
  if (cleaned.length < 8 || cleaned.length > 20) {
    throw new Error('Invalid phone number')
  }
  return cleaned
}

interface OrderItemInput {
  event_id: string
  ticket_type_id: string
  quantity: number
  is_member: boolean
  event_name?: string
  ticket_type_name?: string
  price?: number // Client-provided, will be validated against DB
}

interface OrderRequest {
  customer_name: string
  customer_email: string
  customer_phone: string
  items: OrderItemInput[]
}

// Generate unique QR code data
function generateQRData(orderId: string, orderNumber: string, customerEmail: string): string {
  const timestamp = Date.now()
  // Create a simple QR payload (in production, consider encrypting this)
  const payload = {
    o: orderNumber,
    e: customerEmail,
    t: timestamp,
  }
  // Base64 encode the payload
  return btoa(JSON.stringify(payload))
}

// Main handler
Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: OrderRequest = await req.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_email || !body.items?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(body.customer_name, 100)
    const sanitizedEmail = sanitizeEmail(body.customer_email)
    const sanitizedPhone = sanitizePhone(body.customer_phone)

    if (!sanitizedName || sanitizedName.length < 2) {
      return new Response(JSON.stringify({ error: 'Invalid customer name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch ticket types with current prices and capacity from database
    const ticketTypeIds = body.items.map((item) => item.ticket_type_id)
    const { data: ticketTypes, error: ticketError } = await supabase
      .from('ticket_types')
      .select('id, event_id, name, price, capacity, sold, events(name)')
      .in('id', ticketTypeIds)

    if (ticketError) {
      console.error('Error fetching ticket types:', ticketError)
      return new Response(JSON.stringify({ error: 'Failed to validate ticket types' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
      return new Response(JSON.stringify({ error: 'One or more ticket types not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a map for quick lookup
    const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]))

    // Validate capacity and recalculate prices
    let totalPrice = 0
    const validatedItems: Array<
      OrderItemInput & { dbPrice: number; capacity: number; sold: number }
    > = []

    for (const item of body.items) {
      const dbTicket = ticketTypeMap.get(item.ticket_type_id)
      if (!dbTicket) {
        return new Response(
          JSON.stringify({ error: `Ticket type ${item.ticket_type_id} not found` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      // Check capacity
      const available = dbTicket.capacity - dbTicket.sold
      if (item.quantity > available) {
        return new Response(
          JSON.stringify({
            error: `Not enough tickets available for ${dbTicket.name}. Only ${available} remaining.`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      // Recalculate price from database (ignore client-provided price)
      const memberDiscount = item.is_member ? 0.8 : 1
      const unitPrice = Number(dbTicket.price) * memberDiscount
      const itemTotal = unitPrice * item.quantity
      totalPrice += itemTotal

      validatedItems.push({
        ...item,
        dbPrice: unitPrice,
        capacity: dbTicket.capacity,
        sold: dbTicket.sold,
      })
    }

    // Determine payment status
    const paymentStatus = totalPrice === 0 ? 'completed' : 'pending'

    // Generate order number
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Create orders in a transaction-like manner
    const orderInsertData = validatedItems.map((item) => ({
      event_id: item.event_id,
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      total_price: Math.round(item.dbPrice * item.quantity * 100) / 100,
      customer_name: sanitizedName,
      customer_email: sanitizedEmail,
      customer_phone: sanitizedPhone,
      payment_status: paymentStatus,
      order_number: orderNumber,
      is_member: item.is_member,
    }))

    // Insert orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select('id, event_id, ticket_type_id')

    if (orderError) {
      console.error('Error creating orders:', orderError)
      return new Response(JSON.stringify({ error: 'Failed to create orders' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update ticket sold counts and generate QR codes
    const qrCodes: Array<{ orderId: string; orderNumber: string; qrCode: string }> = []

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const validatedItem = validatedItems[i]
      const newSoldCount = validatedItem.sold + validatedItem.quantity

      // Update sold count
      const { error: updateError } = await supabase
        .from('ticket_types')
        .update({ sold: newSoldCount })
        .eq('id', order.ticket_type_id)

      if (updateError) {
        console.error('Error updating sold count:', updateError)
        // Continue anyway - manual cleanup might be needed
      }

      // Generate QR code
      const qrData = generateQRData(order.id, orderNumber, sanitizedEmail)
      qrCodes.push({
        orderId: order.id,
        orderNumber,
        qrCode: qrData,
      })

      // Update order with QR code
      await supabase.from('orders').update({ qr_code: qrData }).eq('id', order.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber,
        totalPrice: Math.round(totalPrice * 100) / 100,
        paymentStatus,
        qrCodes,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Error processing order:', err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})
