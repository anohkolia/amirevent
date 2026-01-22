<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import HeaderView from '@/components/HeaderView.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheckCircle, faDownload, faEnvelope, faHome } from '@fortawesome/free-solid-svg-icons'

const router = useRouter()
// Variables réactives pour stocker les données de confirmation
const orderIds = ref<string[]>([])
const orderNumber = ref('')
const customerEmail = ref('')
const isFree = ref(false)
const showConfirmation = ref(false)
const qrCodes = ref<Array<{ orderId: string; orderNumber: string; qrCode: string }>>([])

onMounted(() => {
  // Récupération des données de confirmation depuis l'état de l'historique du navigateur
  const state = history.state as Record<string, unknown> //
  // Vérifie si les données de confirmation existent
  if (state && state.orderIds) {
    orderIds.value = state.orderIds as string[]
    orderNumber.value = (state.orderNumber as string) || ''
    customerEmail.value = (state.customerEmail as string) || ''
    isFree.value = (state.isFree as boolean) || false
    qrCodes.value =
      (state.qrCodes as Array<{ orderId: string; orderNumber: string; qrCode: string }>) || []
    showConfirmation.value = true
  } else {
    showConfirmation.value = false
  }
})
// Fonction pour retourner à la page d'accueil
const goHome = () => {
  router.push('/')
}

const downloadTicket = (qrCode: { orderId: string; orderNumber: string; qrCode: string }) => {
  // Crée un fichier texte simple avec les informations du billet
  const ticketData = `
=== AMIREVENT TICKET ===
Order Number: ${qrCode.orderNumber}
Order ID: ${qrCode.orderId}
Customer: ${customerEmail.value}

Scan the QR code at the entrance.
QR Code: ${qrCode.qrCode}
=======================
  `
  const blob = new Blob([ticketData], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ticket-${qrCode.orderNumber}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <HeaderView />

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
          {{ isFree ? 'Registration Confirmed!' : 'Payment Successful!' }}
        </h1>

        <p class="text-muted-foreground mb-8">
          {{ isFree ? 'Your free tickets have been reserved.' : 'Thank you for your purchase!' }}
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
              <button class="text-xs text-primary hover:underline" @click="downloadTicket(qrCode)">
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
          <button
            class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
            @click="goHome">
            <FontAwesomeIcon :icon="faDownload" class="h-4 w-4 mr-2" />
            Télécharger les billets
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
