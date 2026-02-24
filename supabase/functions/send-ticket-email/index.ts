// Edge Function pour l'envoi des billets par email avec Resend
// Usage: Appeler cette fonction après création de la commande pour envoyer les billets

const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Amirevent <bills@amirevent.com>'

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

interface TicketEmailItem {
  eventName: string
  eventLocation: string
  eventDate: string
  eventTime: string
  ticketTypeName: string
  quantity: number
  price: number
}

interface QrCodePayload {
  orderNumber: string
  qrCode: string
}

interface TicketEmailRequest {
  customerEmail?: string
  customerName?: string
  orderNumber?: string
  items?: TicketEmailItem[]
  qrCodes?: QrCodePayload[]
  customer_email?: string
  customer_name?: string
  order_number?: string
  qr_codes?: QrCodePayload[]
}

// Générer le HTML de l'email avec le billet intégré
function generateTicketEmailHtml(params: {
  customerName: string
  customerEmail: string
  orderNumber: string
  items: TicketEmailItem[]
}): string {
  const { customerName, orderNumber, items } = params
  
  const itemsList = items.map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px; text-align: left;">
        <strong>${item.eventName}</strong><br>
        <span style="color: #6b7280; font-size: 14px;">
          ${item.ticketTypeName} × ${item.quantity}
        </span>
      </td>
      <td style="padding: 16px; text-align: right;">
        ${item.eventDate} à ${item.eventTime}<br>
        <span style="color: #6b7280; font-size: 14px;">
          ${item.eventLocation}
        </span>
      </td>
      <td style="padding: 16px; text-align: right; font-weight: bold;">
        ${item.price.toFixed(2)} €
      </td>
    </tr>
  `).join('')

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vos billets - Amirevent</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                <td align="center" style="padding: 32px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">AMIREVENT</h1>
                  <p style="margin: 8px 0 0; color: #c7d2fe; font-size: 16px;">Vos billets d'accès</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px;">
                    Bonjour <strong>${customerName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px;">
                    Merci pour votre achat ! Vos billets ont été réservés avec succès.
                  </p>
                  
                  <!-- Order Info -->
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Numéro de commande</p>
                    <p style="margin: 4px 0 0; color: #1f2937; font-size: 20px; font-weight: bold; font-family: monospace;">${orderNumber}</p>
                  </div>
                  
                  <!-- Tickets Table -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Événement</th>
                        <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Date & Lieu</th>
                        <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsList}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" style="padding: 16px; text-align: right; font-weight: bold; color: #1f2937;">Total</td>
                        <td style="padding: 16px; text-align: right; font-weight: bold; color: #4f46e5; font-size: 18px;">${totalPrice.toFixed(2)} €</td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <!-- QR Code Info -->
                  <div style="background-color: #eff6ff; border: 2px dashed #6366f1; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; color: #1e40af; font-weight: 600; font-size: 16px;">📱 Vos codes QR sont joints à cet email</p>
                    <p style="margin: 0; color: #3b82f6; font-size: 14px;">Présentez ces codes à l'entrée pour accéder à vos événements.</p>
                  </div>
                  
                  <!-- Important Info -->
                  <div style="border-left: 4px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; color: #1f2937; font-weight: 600;">Informations importantes :</p>
                    <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                      <li>Conservez ce email ou téléchargez les billets PDF joints</li>
                      <li>Présentez votre code QR à l'entrée de l'événement</li>
                      <li>Arrivez au moins 15 minutes avant le début</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr style="background-color: #f9fafb;">
                <td align="center" style="padding: 24px;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Amirevent - Votre plateforme de billetterie privée</p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Amirevent. Tous droits réservés.</p>
                </td>
              </tr>
            </table>
            
            <!-- Email Footer -->
            <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
              Cet email a été envoyé à ${params.customerEmail}
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Générer le contenu texte simple de l'email
function generateTicketEmailText(params: {
  customerName: string
  orderNumber: string
  items: TicketEmailItem[]
}): string {
  const { customerName, orderNumber, items } = params
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

  const itemsList = items.map(item => 
    `- ${item.eventName}\n  ${item.ticketTypeName} × ${item.quantity}\n  ${item.eventDate} à ${item.eventTime}\n  ${item.eventLocation}\n  ${item.price.toFixed(2)} €`
  ).join('\n\n')

  return `
Bonjour ${customerName},

Merci pour votre achat ! Vos billets ont été réservés avec succès.

Numéro de commande : ${orderNumber}

VOS BILLETS :
${itemsList}

-----------------------------------------
TOTAL : ${totalPrice.toFixed(2)} €

Vos codes QR sont joints à cet email en pièce jointe.
Présentez ces codes à l'entrée pour accéder à vos événements.

Informations importantes :
- Conservez ce email ou téléchargez les billets PDF joints
- Présentez votre code QR à l'entrée de l'événement
- Arrivez au moins 15 minutes avant le début

---
Amirevent - Votre plateforme de billetterie privée
© ${new Date().getFullYear()} Amirevent
  `.trim()
}

// Envoyer l'email avec Resend
async function sendTicketEmail(params: {
  to: string
  customerName: string
  orderNumber: string
  items: TicketEmailItem[]
  qrCodeAttachments: Array<{
    filename: string
    content: string // base64
    contentType: string
  }>
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, customerName, orderNumber, items, qrCodeAttachments } = params

  const html = generateTicketEmailHtml({
    customerName,
    customerEmail: to,
    orderNumber,
    items,
  })

  const text = generateTicketEmailText({
    customerName,
    orderNumber,
    items,
  })

  // Préparer les pièces jointes pour Resend
  const attachments = qrCodeAttachments.map((attachment) => ({
    filename: attachment.filename,
    content: attachment.content,
    contentType: attachment.contentType,
  }))

  // Pour le développement/testing sans Resend
  if (!resendApiKey) {
    const runningLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
    const missingKeyError = 'RESEND_API_KEY is not configured'

    if (!runningLocal) {
      console.error(missingKeyError)
      return {
        success: false,
        error: missingKeyError,
      }
    }

    console.log('[DEV] Email simulation - Pas de clé API Resend configurée')
    console.log(`[DEV] Destinataire: ${to}`)
    console.log(`[DEV] Commande: ${orderNumber}`)
    console.log(`[DEV] Billets: ${items.length}`)
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [to],
        subject: `Vos billets - ${orderNumber} | Amirevent`,
        html,
        text,
        attachments,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erreur Resend:', error)
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
      }
    }

    const result = await response.json()
    console.log('Email envoyé avec succès:', result.id)
    return {
      success: true,
      messageId: result.id,
    }
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

// Handler principal
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json() as TicketEmailRequest

    // Validation des champs requis
    const customerEmail = body.customerEmail ?? body.customer_email
    const customerName = body.customerName ?? body.customer_name
    const orderNumber = body.orderNumber ?? body.order_number
    const items = body.items
    const qrCodes = body.qrCodes ?? body.qr_codes ?? []

    if (!customerEmail || !customerName || !orderNumber || !items?.length) {
      return jsonResponse({ 
        error: 'Missing required fields: customerEmail, customerName, orderNumber, items' 
      }, 400)
    }

    console.log(`Envoi des billets pour commande ${orderNumber} à ${customerEmail}`)

    // Préparer les pièces jointes QR codes
    const qrCodeAttachments = qrCodes.map((qc, index: number) => ({
      filename: `billet-${qc.orderNumber}-${index + 1}.png`,
      content: qc.qrCode, // QR code en base64 ou URL
      contentType: 'image/png',
    }))

    // Si les QR codes sont des URLs, les convertir en images
    // Dans l'implémentation actuelle, les QR codes sont des données base64

    // Envoyer l'email
    const result = await sendTicketEmail({
      to: customerEmail,
      customerName,
      orderNumber,
      items,
      qrCodeAttachments,
    })

    if (result.success) {
      return jsonResponse({
        success: true,
        messageId: result.messageId,
        message: 'Email envoyé avec succès',
      })
    } else {
      return jsonResponse({
        success: false,
        error: result.error,
      }, 500)
    }
  } catch (err) {
    console.error('Erreur lors du traitement de la requête:', err)
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      500,
    )
  }
})
