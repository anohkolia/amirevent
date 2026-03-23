<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft, faCreditCard, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/integrations/supabase/client'

interface CheckoutForm {
  customerName: string
  customerEmail: string
  customerPhone: string
}

interface FormErrors {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

const router = useRouter()
const cartStore = useCartStore()

const items = computed(() => cartStore.items)
const totalPrice = computed(() => cartStore.getTotalPrice())
const isFree = computed(() => totalPrice.value === 0)

const formData = ref<CheckoutForm>({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
})

const errors = ref<FormErrors>({})
const isLoading = ref(false)

const submitLabel = computed(() => {
  if (isLoading.value) return 'Traitement en cours...'
  if (isFree.value) return 'Confirmer l’inscription'
  return `Procéder au paiement - €${totalPrice.value.toFixed(2)}`
})

const validateForm = (): boolean => {
  const currentErrors: FormErrors = {}
  let isValid = true

  const name = formData.value.customerName.trim()
  const email = formData.value.customerEmail.trim()
  const phone = formData.value.customerPhone.trim()

  if (!name) {
    currentErrors.customerName = 'Le nom est obligatoire.'
    isValid = false
  } else if (name.length < 2) {
    currentErrors.customerName = 'Le nom doit contenir au moins 2 caractères.'
    isValid = false
  } else if (name.length > 100) {
    currentErrors.customerName = 'Le nom doit contenir moins de 100 caractères.'
    isValid = false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    currentErrors.customerEmail = 'L’adresse email est obligatoire.'
    isValid = false
  } else if (!emailRegex.test(email)) {
    currentErrors.customerEmail = 'Veuillez saisir une adresse email valide.'
    isValid = false
  }

  if (!phone) {
    currentErrors.customerPhone = 'Le numéro de téléphone est obligatoire.'
    isValid = false
  } else if (phone.length < 8) {
    currentErrors.customerPhone = 'Le numéro doit contenir au moins 8 caractères.'
    isValid = false
  } else if (phone.length > 20) {
    currentErrors.customerPhone = 'Le numéro doit contenir moins de 20 caractères.'
    isValid = false
  }

  errors.value = currentErrors
  return isValid
}

const getItemPrice = (item: (typeof items.value)[0]) => {
  const unitPrice = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
  return unitPrice * item.quantity
}

const fieldInputClass = (hasError?: string) =>
  `input-base ${hasError ? 'border-destructive focus:border-destructive focus:shadow-[0_0_0_3px_hsl(0_84%_60%_/_0.2)]' : ''}`

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!items.value.length) {
    router.push('/cart')
    return
  }

  isLoading.value = true

  try {
    const orderItems = items.value.map((item) => ({
      event_id: item.event.id,
      ticket_type_id: item.ticketType.id,
      quantity: item.quantity,
      is_member: item.isMember,
      event_name: item.event.name,
      ticket_type_name: item.ticketType.name,
    }))

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!publishableKey) {
      throw new Error('Configuration Supabase incomplète: VITE_SUPABASE_PUBLISHABLE_KEY manquant.')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: publishableKey,
    }

    const bearerToken = accessToken || anonKey || publishableKey
    headers['Authorization'] = `Bearer ${bearerToken}`

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_name: formData.value.customerName.trim(),
        customer_email: formData.value.customerEmail.trim(),
        customer_phone: formData.value.customerPhone.trim(),
        items: orderItems,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Impossible de créer la commande.')
    }

    const result = await response.json()

    if (!result.emailSent) {
      toast.warning('Commande créée, mais l’email des billets n’a pas pu être envoyé.')
    }

    const itemsData = items.value.map((item) => ({
      eventId: item.event.id,
      eventName: item.event.name,
      eventLocation: item.event.location,
      eventDate: item.event.date,
      eventTime: item.event.time,
      ticketTypeName: item.ticketType.name,
      quantity: item.quantity,
      price: getItemPrice(item),
    }))

    const confirmationData = {
      orderIds: result.qrCodes.map((qr: { orderId: string }) => qr.orderId),
      orderNumber: result.orderNumber,
      customerEmail: formData.value.customerEmail.trim(),
      customerName: formData.value.customerName.trim(),
      purchaseDate: new Date().toISOString(),
      isFree: result.paymentStatus === 'completed',
      emailSent: result.emailSent || false,
      emailError: result.emailError || null,
      qrCodes: result.qrCodes,
      items: itemsData,
    }

    cartStore.clearCart()
    localStorage.setItem('amirevent_confirmation', JSON.stringify(confirmationData))

    router.push({
      name: 'confirmation',
      state: confirmationData,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    toast.error(
      error instanceof Error
        ? error.message
        : 'Impossible de finaliser votre commande. Merci de réessayer.',
    )
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/cart')
}

onMounted(() => {
  if (!items.value.length) {
    router.push('/cart')
  }
})
</script>

<template>
  <div class="min-h-screen py-10 md:py-12">
    <div class="app-container max-w-3xl">
      <button type="button" class="btn btn-ghost mb-5 px-0 text-sm" @click="goBack">
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4" />
        Retour au panier
      </button>

      <h1 class="font-display text-3xl font-bold text-foreground">Finaliser la commande</h1>

      <div class="mt-7 space-y-6">
        <section class="panel rounded-xl p-6">
          <h2 class="font-display text-lg font-semibold text-foreground">Résumé de commande</h2>
          <div class="mt-4 space-y-3">
            <div v-for="item in items" :key="item.ticketType.id" class="flex items-start justify-between gap-3">
              <div>
                <p class="text-foreground">{{ item.event.name }}</p>
                <p class="text-sm text-muted-foreground">{{ item.ticketType.name }} x{{ item.quantity }}</p>
              </div>
              <p class="font-semibold text-foreground">€{{ getItemPrice(item).toFixed(2) }}</p>
            </div>
            <div class="flex items-end justify-between border-t border-border pt-3">
              <span class="font-semibold text-foreground">Total</span>
              <span class="font-display text-2xl font-bold text-primary">
                {{ isFree ? 'Gratuit' : `€${totalPrice.toFixed(2)}` }}
              </span>
            </div>
          </div>
        </section>

        <section class="panel rounded-xl p-6">
          <h2 class="font-display text-lg font-semibold text-foreground">Vos informations</h2>

          <form class="mt-4 space-y-4" novalidate @submit.prevent="handleSubmit">
            <div class="space-y-2">
              <label for="checkout-name" class="font-medium text-foreground">Nom et prénom</label>
              <input
                id="checkout-name"
                v-model="formData.customerName"
                type="text"
                autocomplete="name"
                required
                :class="fieldInputClass(errors.customerName)"
                :aria-invalid="Boolean(errors.customerName)"
                aria-describedby="checkout-name-error"
                placeholder="Ex: Alex Dupont"
              />
              <p id="checkout-name-error" class="text-sm text-destructive" aria-live="polite">
                {{ errors.customerName }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="checkout-email" class="font-medium text-foreground">Email</label>
              <input
                id="checkout-email"
                v-model="formData.customerEmail"
                type="email"
                autocomplete="email"
                required
                :class="fieldInputClass(errors.customerEmail)"
                :aria-invalid="Boolean(errors.customerEmail)"
                aria-describedby="checkout-email-error"
                placeholder="exemple@email.com"
              />
              <p id="checkout-email-error" class="text-sm text-destructive" aria-live="polite">
                {{ errors.customerEmail }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="checkout-phone" class="font-medium text-foreground">Téléphone</label>
              <input
                id="checkout-phone"
                v-model="formData.customerPhone"
                type="tel"
                autocomplete="tel"
                required
                :class="fieldInputClass(errors.customerPhone)"
                :aria-invalid="Boolean(errors.customerPhone)"
                aria-describedby="checkout-phone-error"
                placeholder="+33 01 00 00 00 00"
              />
              <p id="checkout-phone-error" class="text-sm text-destructive" aria-live="polite">
                {{ errors.customerPhone }}
              </p>
            </div>

            <div class="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              Vos informations sont utilisées uniquement pour générer et vous envoyer vos billets.
            </div>

            <button type="submit" class="btn btn-primary mt-2 w-full" :disabled="isLoading">
              <FontAwesomeIcon v-if="isLoading" :icon="faSpinner" class="h-4 w-4 animate-spin" />
              <FontAwesomeIcon v-else :icon="faCreditCard" class="h-4 w-4" />
              {{ submitLabel }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
