<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheckCircle, faDownload, faEnvelope, faHome } from '@fortawesome/free-solid-svg-icons'
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

const downloadTicket = (qrCode: { orderId: string; orderNumber: string; qrCode: string }, itemIndex: number = 0) => {
  // Utiliser les données de items.value (chargées depuis localStorage/history.state)
  // plutôt que le store qui peut être vide après rafraîchissement
  const item = items.value[itemIndex] || (items.value.length > 0 ? items.value[0] : null)

  if (!item) {
    console.error('No item data available for PDF generation')
    return
  }

  const doc = new jsPDF()

  // Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('AMIREVENT', 105, 20, { align: 'center' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text('BILLET D\'ACCÈS', 105, 30, { align: 'center' })

  // Horizontal line
  doc.setLineWidth(0.5)
  doc.line(20, 35, 190, 35)

  // Left side - Event Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('ÉVÉNEMENT', 20, 50)
  doc.setLineWidth(0.3)
  doc.line(20, 52, 90, 52)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Nom:', 20, 62)
  doc.text(item.eventName ? String(item.eventName) : 'N/A', 50, 62)

  doc.text('Lieu:', 20, 72)
  doc.text(item.eventLocation ? String(item.eventLocation) : 'N/A', 50, 72)

  doc.text('Date:', 20, 82)
  const formattedDate = item.eventDate ? format(new Date(item.eventDate), 'dd MMMM yyyy', { locale: fr }) : 'N/A'
  doc.text(formattedDate, 50, 82)

  doc.text('Heure:', 20, 92)
  doc.text(item.eventTime ? String(item.eventTime) : 'N/A', 50, 92)

  doc.text('Prix:', 20, 102)
  doc.text(`${item?.price?.toFixed(2) || '0.00'} €`, 50, 102)

  doc.text('Type:', 20, 112)
  doc.text(item?.ticketTypeName || 'Standard', 50, 112)

  // Right side - Customer Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', 120, 50)
  doc.line(120, 52, 190, 52)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Nom:', 120, 62)
  doc.text(customerName.value || 'N/A', 150, 62)

  doc.text('Email:', 120, 72)
  doc.text(customerEmail.value || 'N/A', 150, 72)

  doc.text('Commande:', 120, 82)
  doc.text(qrCode.orderNumber, 150, 82)

  doc.text('Achat:', 120, 92)
  const formattedPurchaseDate = purchaseDate.value ? format(new Date(purchaseDate.value), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A'
  doc.text(formattedPurchaseDate, 150, 92)

  // QR Code section - centered at bottom
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Scannez ce code QR à l\'entrée:', 105, 130, { align: 'center' })

  // Generate QR code as image using data URL
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode.qrCode)}`
  doc.addImage(qrDataUrl, 'PNG', 75, 135, 60, 60)

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text('Merci pour votre achat! Conservez ce billet.', 105, 210, { align: 'center' })
  doc.text('Amirevent - Votre plateforme de billetterie privée', 105, 216, { align: 'center' })

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

        <p class="text-muted-foreground mb-8">
          {{ isFree ? 'Vos billets gratuits ont été réservés.' : 'Merci pour votre achat !' }}
          <br />
          Un courriel de confirmation contenant vos billets a été envoyé à:
        </p>

        <p class="font-semibold text-primary mb-8">{{ customerEmail }}</p>

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

        <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
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
