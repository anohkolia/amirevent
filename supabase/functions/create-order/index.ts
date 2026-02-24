import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
}

// Create service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

// Helper function to create JSON response with CORS headers
function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

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

interface TicketTypeData {
  id: string
  event_id: string
  name: string
  price: number
  capacity: number
  sold: number
  events: {
    id: string
    name: string
    location: string
    date: string
    time: string
  } | null
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

// Verify JWT token and get user info (optional for anonymous users)
// Simplified version - always allow anonymous access
async function verifyToken(authHeader: string | null): Promise<{ userId: string | null; isAuthenticated: boolean }> {
  // Always allow anonymous access - the Authorization header is optional
  // Users can place orders without being logged in
  if (!authHeader) {
    console.log('No authorization header - proceeding as anonymous user')
    return { userId: null, isAuthenticated: false }
  }

  // If header is provided, try to extract user info
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return { userId: null, isAuthenticated: false }
  }

  // For now, just log and allow the request even if token is invalid
  // This allows users to complete orders even if their session expired
  console.log('Authorization header present but not validating (anonymous access allowed)')
  return { userId: null, isAuthenticated: false }
}

// Send ticket email via Edge Function
async function sendTicketEmail(params: {
  customerEmail: string
  customerName: string
  orderNumber: string
  items: Array<{
    eventName: string
    eventLocation: string
    eventDate: string
    eventTime: string
    ticketTypeName: string
    quantity: number
    price: number
  }>
  qrCodes: Array<{ orderNumber: string; qrCode: string }>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-ticket-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(params),
    })

    if (emailResponse.ok) {
      const result = await emailResponse.json()
      return { success: true, messageId: result.messageId }
    } else {
      const error = await emailResponse.text()
      return { success: false, error }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // Get and verify authorization header (optional for anonymous users)
    const authHeader = req.headers.get('Authorization')
    const { userId, isAuthenticated } = await verifyToken(authHeader)

    console.log(`Order request - Authenticated: ${isAuthenticated}, UserId: ${userId ?? 'anonymous'}`)

    const body: OrderRequest = await req.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_email || !body.items?.length) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(body.customer_name, 100)
    const sanitizedEmail = sanitizeEmail(body.customer_email)
    const sanitizedPhone = sanitizePhone(body.customer_phone)

    if (!sanitizedName || sanitizedName.length < 2) {
      return jsonResponse({ error: 'Invalid customer name' }, 400)
    }

    // Extract ticket type IDs from items
    const ticketTypeIds = body.items.map((item) => item.ticket_type_id)

    // Fetch ticket types with events info for email
    const { data: ticketTypes, error: ticketError } = await supabaseAdmin
      .from('ticket_types')
      .select('id, event_id, name, price, capacity, sold, events(id, name, location, date, time)')
      .in('id', ticketTypeIds) as { data: TicketTypeData[] | null; error: Error | null }

    if (ticketError) {
      console.error('Error fetching ticket types:', ticketError)
      return jsonResponse({ error: 'Failed to validate ticket types' }, 500)
    }

    if (!ticketTypes || ticketTypes.length !== ticketTypeIds.length) {
      return jsonResponse({ error: 'One or more ticket types not found' }, 400)
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
        return jsonResponse({ error: `Ticket type ${item.ticket_type_id} not found` }, 400)
      }

      // Check capacity
      const available = dbTicket.capacity - dbTicket.sold
      if (item.quantity > available) {
        return jsonResponse(
          {
            error: `Not enough tickets available for ${dbTicket.name}. Only ${available} remaining.`,
          },
          400,
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
    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsertData)
      .select('id, event_id, ticket_type_id')

    if (orderError) {
      console.error('Error creating orders:', orderError)
      return jsonResponse({ error: 'Failed to create orders' }, 500)
    }

    if (!orders || orders.length !== validatedItems.length) {
      console.error('Unexpected order insert result:', orders)
      return jsonResponse({ error: 'Failed to create complete order set' }, 500)
    }

    // Update ticket sold counts and generate QR codes
    const qrCodes: Array<{ orderId: string; orderNumber: string; qrCode: string }> = []

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const validatedItem = validatedItems[i]
      const newSoldCount = validatedItem.sold + validatedItem.quantity

      // Update sold count
      const { error: updateError } = await supabaseAdmin
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
      await supabaseAdmin.from('orders').update({ qr_code: qrData }).eq('id', order.id)
    }

    // Send confirmation email with tickets
    let emailSent = false
    let emailError: string | null = null

    try {
      // Prepare items with full event info for email
      const emailItems = validatedItems.map((item) => {
        const dbTicket = ticketTypeMap.get(item.ticket_type_id)
        const event = dbTicket?.events
        return {
          eventName: event?.name || item.event_name || 'Événement',
          eventLocation: event?.location || '',
          eventDate: event?.date || '',
          eventTime: event?.time || '',
          ticketTypeName: item.ticket_type_name || item.event_name || 'Standard',
          quantity: item.quantity,
          price: Math.round(item.dbPrice * item.quantity * 100) / 100,
        }
      })

      const emailResult = await sendTicketEmail({
        customerEmail: sanitizedEmail,
        customerName: sanitizedName,
        orderNumber,
        items: emailItems,
        qrCodes: qrCodes.map((qc) => ({ orderNumber: qc.orderNumber, qrCode: qc.qrCode })),
      })

      emailSent = emailResult.success
      if (!emailResult.success) {
        emailError = emailResult.error || 'Unknown error'
        console.error('Failed to send ticket email:', emailError)
      } else {
        console.log('Ticket email sent successfully:', emailResult.messageId)
      }
    } catch (err) {
      console.error('Error sending ticket email:', err)
      emailError = err instanceof Error ? err.message : 'Unknown error'
    }

    return jsonResponse({
      success: true,
      orderNumber,
      totalPrice: Math.round(totalPrice * 100) / 100,
      paymentStatus,
      qrCodes,
      isAuthenticated,
      emailSent,
      emailError,
    })
  } catch (err) {
    console.error('Error processing order:', err)
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      500,
    )
  }
})
