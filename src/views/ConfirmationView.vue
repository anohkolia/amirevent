<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import HeaderView from '@/components/HeaderView.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheckCircle, faDownload, faEnvelope, faHome } from '@fortawesome/free-solid-svg-icons'

const router = useRouter()

const orderIds = ref<string[]>([])
const customerEmail = ref('')
const isFree = ref(false)
const showConfirmation = ref(false)

onMounted(() => {
  // Try to get data from history state
  const state = history.state as Record<string, unknown>

  if (state && state.orderIds) {
    orderIds.value = state.orderIds as string[]
    customerEmail.value = (state.customerEmail as string) || ''
    isFree.value = (state.isFree as boolean) || false
    showConfirmation.value = true
  } else {
    showConfirmation.value = false
  }
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <HeaderView />

    <!-- No Order Found -->
    <div v-if="!showConfirmation" class="container py-16 text-center">
      <h1 class="font-display text-2xl font-semibold text-foreground mb-4">No order found</h1>
      <RouterLink to="/">
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
        >
          Back to Events
        </button>
      </RouterLink>
    </div>

    <!-- Confirmation -->
    <div v-else class="container py-16 max-w-xl">
      <div class="bg-card border border-border rounded-lg text-center p-8">
        <!-- Success Icon -->
        <div
          class="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
        >
          <FontAwesomeIcon :icon="faCheckCircle" class="h-10 w-10 text-primary" />
        </div>

        <h1 class="font-display text-3xl font-bold text-foreground mb-4">
          {{ isFree ? 'Registration Confirmed!' : 'Payment Successful!' }}
        </h1>

        <p class="text-muted-foreground mb-8">
          {{ isFree ? 'Your free tickets have been reserved.' : 'Thank you for your purchase!' }}
          <br />
          A confirmation email with your tickets has been sent to:
        </p>

        <p class="font-semibold text-primary mb-8">{{ customerEmail }}</p>

        <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
          <FontAwesomeIcon :icon="faEnvelope" class="h-4 w-4" />
          <span>Check your inbox for your ticket(s) with QR code</span>
        </div>

        <div class="space-y-3">
          <button
            class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
            @click="goHome"
          >
            <FontAwesomeIcon :icon="faDownload" class="h-4 w-4 mr-2" />
            Download Tickets
          </button>

          <RouterLink to="/" class="block">
            <button
              variant="outline"
              class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-foreground font-medium transition-colors"
            >
              <FontAwesomeIcon :icon="faHome" class="h-4 w-4 mr-2" />
              Back to Events
            </button>
          </RouterLink>
        </div>

        <p v-if="orderIds.length > 0" class="text-xs text-muted-foreground mt-8">
          Order ID: {{ orderIds.join(', ') }}
        </p>
      </div>
    </div>
  </div>
</template>
