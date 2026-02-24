<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheckCircle, faDownload, faEnvelope, faHome, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Variables réactives pour stocker les données de confirmation
const orderIds = ref<string[]>([])
const orderNumber = ref('')
const customerEmail = ref('')
const customerName = ref('')
const purchaseDate = ref('')
const isFree = ref(false)
const showConfirmation = ref(false)
const emailSent = ref(false)
const emailError = ref<string | null>(null)
const qrCodes = ref<Array<{ orderId: string; orderNumber: string; qrCode: string }>>([])
const items = ref<Array<{
  eventId: string
  eventName: string
  eventLocation: string
  eventDate: string
  eventTime: string
  ticketTypeName: string
  quantity: number
  price: number
}>>([])

onMounted(() => {
  // Récupération des données de confirmation depuis l'état de l'historique du navigateur
  const state = history.state as Record<string, unknown> //
  // Vérifie si les données de confirmation existent
  if (state && state.orderIds) {
    // Utiliser les données de history.state
    orderIds.value = state.orderIds as string[]
    orderNumber.value = (state.orderNumber as string) || ''
    customerEmail.value = (state.customerEmail as string) || ''
    customerName.value = (state.customerName as string) || ''
    purchaseDate.value = (state.purchaseDate as string) || ''
    isFree.value = (state.isFree as boolean) || false
    emailSent.value = (state.emailSent as boolean) || false
    emailError.value = (state.emailError as string) || null
    qrCodes.value =
      (state.qrCodes as Array<{ orderId: string; orderNumber: string; qrCode: string }>) || []
    items.value =
      (state.items as Array<{
        eventId: string
        eventName: string
        eventLocation: string
        eventDate: string
        eventTime: string
        ticketTypeName: string
        quantity: number
        price: number
      }>) || []
    showConfirmation.value = true

    // Les données de history.state sont complètes, pas besoin de localStorage
    localStorage.removeItem('amirevent_confirmation')
  } else {
    // Essayer de récupérer depuis localStorage (si l'utilisateur a rafraîchi la page)
    const savedConfirmation = localStorage.getItem('amirevent_confirmation')
    if (savedConfirmation) {
      try {
        const parsed = JSON.parse(savedConfirmation)
        if (parsed.orderIds) {
          orderIds.value = parsed.orderIds || []
          orderNumber.value = parsed.orderNumber || ''
          customerEmail.value = parsed.customerEmail || ''
          customerName.value = parsed.customerName || ''
          purchaseDate.value = parsed.purchaseDate || ''
          isFree.value = parsed.isFree || false
          emailSent.value = parsed.emailSent || false
          emailError.value = parsed.emailError || null
          qrCodes.value = parsed.qrCodes || []
          items.value = parsed.items || []
          showConfirmation.value = true
          return
        }
      } catch (e) {
        console.error('Erreur lors de la lecture des données de confirmation depuis localStorage:', e)
      }
    }
    showConfirmation.value = false
  }
})

async function generateQrCodeImageDataUrl(qrPayload: string): Promise<string | null> {
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encodeURIComponent(qrPayload)}`
    const response = await fetch(qrUrl)

    if (!response.ok) return null

    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erreur lors de la génération du QR code image:', error)
    return null
  }
}

const downloadTicket = async (
  qrCode: { orderId: string; orderNumber: string; qrCode: string },
  itemIndex: number = 0,
) => {
  // Utiliser les données de items.value (chargées depuis localStorage/history.state)
  // plutôt que le store qui peut être vide après rafraîchissement
  const item = items.value[itemIndex] || (items.value.length > 0 ? items.value[0] : null)

  if (!item) {
    console.error('No item data available for PDF generation')
    return
  }

  const safeValue = (value?: string, fallback: string = 'N/A') => {
    const v = value?.trim()
    return v && v.length > 0 ? v : fallback
  }

  const formattedDate = item.eventDate
    ? format(new Date(item.eventDate), 'dd MMMM yyyy', { locale: fr })
    : 'N/A'
  const formattedPurchaseDate = purchaseDate.value
    ? format(new Date(purchaseDate.value), 'dd/MM/yyyy HH:mm', { locale: fr })
    : 'N/A'
  const amount = `${item?.price?.toFixed(2) || '0.00'} €`

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const primary = { r: 46, g: 58, b: 138 }
  const secondary = { r: 15, g: 23, b: 42 }
  const border = { r: 203, g: 213, b: 225 }
  const text = { r: 30, g: 41, b: 59 }
  const muted = { r: 100, g: 116, b: 139 }
  const soft = { r: 248, g: 250, b: 252 }

  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, 210, 297, 'F')

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(border.r, border.g, border.b)
  doc.roundedRect(10, 10, 190, 277, 4, 4, 'FD')

  doc.setFillColor(primary.r, primary.g, primary.b)
  doc.roundedRect(10, 10, 190, 34, 4, 4, 'F')
  doc.setFillColor(primary.r, primary.g, primary.b)
  doc.rect(10, 40, 190, 4, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('AMIREVENT', 18, 23)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Billet d\'acces evenementiel', 18, 31)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('N° COMMANDE', 150, 21)
  doc.setFontSize(12)
  doc.text(qrCode.orderNumber, 150, 28)

  doc.setDrawColor(border.r, border.g, border.b)
  doc.setLineWidth(0.35)
  doc.setLineDashPattern([1.2, 1.2], 0)
  doc.line(16, 56, 194, 56)
  doc.setLineDashPattern([], 0)

  doc.setFillColor(soft.r, soft.g, soft.b)
  doc.setDrawColor(border.r, border.g, border.b)
  doc.roundedRect(16, 64, 112, 118, 3, 3, 'FD')

  doc.setTextColor(secondary.r, secondary.g, secondary.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('DETAILS DE L\'EVENEMENT', 20, 74)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(text.r, text.g, text.b)
  doc.setFontSize(10)
  doc.text('Nom', 20, 84)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(doc.splitTextToSize(safeValue(item.eventName), 102), 20, 90)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Lieu', 20, 106)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(doc.splitTextToSize(safeValue(item.eventLocation), 102), 20, 112)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Date et heure', 20, 128)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${formattedDate} - ${safeValue(item.eventTime)}`, 20, 134)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Type de billet', 20, 150)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(safeValue(item.ticketTypeName, 'Standard'), 20, 156)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Montant', 20, 172)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(primary.r, primary.g, primary.b)
  doc.text(amount, 20, 178)

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(border.r, border.g, border.b)
  doc.roundedRect(132, 64, 62, 118, 3, 3, 'FD')

  doc.setTextColor(secondary.r, secondary.g, secondary.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('PORTEUR', 136, 74)

  doc.setTextColor(text.r, text.g, text.b)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Nom', 136, 84)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(doc.splitTextToSize(safeValue(customerName.value), 54), 136, 90)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Email', 136, 108)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(doc.splitTextToSize(safeValue(customerEmail.value), 54), 136, 114)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Date d\'achat', 136, 132)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(formattedPurchaseDate, 136, 138)

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(border.r, border.g, border.b)
  doc.roundedRect(16, 190, 178, 82, 3, 3, 'FD')

  doc.setTextColor(secondary.r, secondary.g, secondary.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('CONTROLE D\'ACCES', 20, 201)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(muted.r, muted.g, muted.b)
  doc.text('Presentez ce QR code a l\'entree. Un scan valide ce billet une seule fois.', 20, 208)

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(border.r, border.g, border.b)
  doc.roundedRect(130, 205, 52, 52, 2, 2, 'FD')

  const qrImageData = await generateQrCodeImageDataUrl(qrCode.qrCode)
  if (qrImageData) {
    doc.addImage(qrImageData, 'PNG', 134, 209, 44, 44)
  } else {
    doc.setTextColor(muted.r, muted.g, muted.b)
    doc.setFontSize(8.5)
    doc.text('QR indisponible', 156, 231, { align: 'center' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(muted.r, muted.g, muted.b)
  doc.text('Billet genere automatiquement - Merci de conserver ce document.', 20, 264)
  doc.text('amirevent.com', 20, 270)

  doc.save(`ticket-${qrCode.orderNumber}.pdf`)
}

const downloadAllTickets = () => {
  qrCodes.value.forEach((qrCode, index) => {
    setTimeout(() => {
      downloadTicket(qrCode, index)
    }, index * 500) // Small delay between downloads
  })
}
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- No Order Found -->
    <div v-if="!showConfirmation" class="container py-16 text-center">
      <h1 class="font-display text-2xl font-semibold text-foreground mb-4">Aucune commande trouvée</h1>
      <RouterLink to="/">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium">
          Retour aux événements
        </button>
      </RouterLink>
    </div>

    <!-- Confirmation -->
    <div v-else class="container py-16 max-w-xl">
      <div class="bg-card border border-border rounded-lg text-center p-8">
        <!-- Success Icon -->
        <div class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon :icon="faCheckCircle" class="h-10 w-10 text-primary" />
        </div>

        <h1 class="font-display text-3xl font-bold text-foreground mb-4">
          {{ isFree ? 'Inscription confirmée!' : 'Paiement réussi!' }}
        </h1>

        <p v-if="emailSent" class="text-muted-foreground mb-8">
          {{ isFree ? 'Vos billets gratuits ont été réservés.' : 'Merci pour votre achat !' }}
          <br />
          Un courriel de confirmation contenant vos billets a été envoyé à:
        </p>
        <p v-else class="text-muted-foreground mb-8">
          {{ isFree ? 'Vos billets gratuits ont été réservés.' : 'Merci pour votre achat !' }}
          <br />
          L’envoi par email n’a pas abouti pour le moment. Vous pouvez télécharger vos billets ci-dessous.
        </p>

        <p class="font-semibold text-primary mb-8">{{ customerEmail }}</p>

        <div v-if="!emailSent" class="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-left">
          <div class="flex items-start gap-2 text-amber-800">
            <FontAwesomeIcon :icon="faTriangleExclamation" class="mt-0.5 h-4 w-4" />
            <div class="text-sm">
              <p class="font-medium">Email non envoyé</p>
              <p v-if="emailError" class="mt-1 break-words">{{ emailError }}</p>
              <p v-else class="mt-1">Aucune erreur détaillée n’a été retournée.</p>
            </div>
          </div>
        </div>

        <div v-if="orderNumber" class="text-sm text-muted-foreground mb-4">
          Numéro de commande <span class="font-mono font-semibold">{{ orderNumber }}</span>
        </div>

        <!-- QR Codes Section -->
        <div v-if="qrCodes.length > 0" class="mb-8">
          <h3 class="text-sm font-medium text-muted-foreground mb-4">Vos billets</h3>
          <div class="space-y-4">
            <div v-for="(qrCode, index) in qrCodes" :key="qrCode.orderId" class="bg-muted/50 rounded-lg p-4">
              <p class="text-sm font-medium text-foreground mb-2">Billet {{ index + 1 }}</p>
              <div class="bg-white p-4 rounded inline-block mb-2">
                <div class="w-32 h-32 bg-gray-200 flex items-center justify-center text-xs text-muted-foreground">
                  [QR: {{ qrCode.qrCode.substring(0, 20) }}...]
                </div>
              </div>
              <button class="text-xs text-primary hover:underline" @click="downloadTicket(qrCode, index)">
                <FontAwesomeIcon :icon="faDownload" class="mr-1" />
                Télécharger
              </button>
            </div>
          </div>
        </div>

        <div v-if="emailSent" class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
          <FontAwesomeIcon :icon="faEnvelope" class="h-4 w-4" />
          <span>Consultez votre boîte mail pour trouver votre/vos billet(s) avec code QR.</span>
        </div>

        <div class="space-y-3">
          <button v-if="qrCodes.length > 0"
            class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
            @click="downloadAllTickets">
            <FontAwesomeIcon :icon="faDownload" class="h-4 w-4 mr-2" />
            Télécharger les billets ({{ qrCodes.length }})
          </button>

          <RouterLink to="/" class="block">
            <button variant="outline"
              class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-foreground font-medium transition-colors">
              <FontAwesomeIcon :icon="faHome" class="h-4 w-4 mr-2" />
              Retour aux événements
            </button>
          </RouterLink>
        </div>

        <p v-if="orderIds.length > 0" class="text-xs text-muted-foreground mt-8">
          Commande ID: {{ orderIds.join(', ') }}
        </p>
      </div>
    </div>
  </div>
</template>
