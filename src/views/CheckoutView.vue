<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import HeaderView from '@/components/HeaderView.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft, faCreditCard, faSpinner } from '@fortawesome/free-solid-svg-icons'

// Définition des types pour le formulaire de commande
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

// Données du formulaire de commande
const formData = ref<CheckoutForm>({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
})

const errors = ref<FormErrors>({})
const isLoading = ref(false)

// Fonction de validation du formulaire
const validateForm = (): boolean => {
  const newErrors: FormErrors = {}
  let isValid = true

  // validation du nom
  if (!formData.value.customerName.trim()) {
    newErrors.customerName = 'Name is required'
    isValid = false
  } else if (formData.value.customerName.length < 2) {
    newErrors.customerName = 'Name must be at least 2 characters'
    isValid = false
  } else if (formData.value.customerName.length > 100) {
    newErrors.customerName = 'Name must be less than 100 characters'
    isValid = false
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.customerEmail.trim()) {
    newErrors.customerEmail = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(formData.value.customerEmail)) {
    newErrors.customerEmail = 'Invalid email address'
    isValid = false
  }

  // Valdation du téléphone
  if (!formData.value.customerPhone.trim()) {
    newErrors.customerPhone = 'Phone number is required'
    isValid = false
  } else if (formData.value.customerPhone.length < 8) {
    newErrors.customerPhone = 'Phone number must be at least 8 characters'
    isValid = false
  } else if (formData.value.customerPhone.length > 20) {
    newErrors.customerPhone = 'Phone number must be less than 20 characters'
    isValid = false
  }

  errors.value = newErrors
  return isValid
}

const goBack = () => {
  router.push('/cart')
}

// Fonction de soumission du formulaire
const handleSubmit = async () => {
  if (!validateForm()) return
  if (items.value.length === 0) {
    router.push('/cart')
    return
  }

  isLoading.value = true

  try {
    // Prépare les données de la commande
    const orderItems = items.value.map((item) => ({
      event_id: item.event.id,
      ticket_type_id: item.ticketType.id,
      quantity: item.quantity,
      is_member: item.isMember,
      event_name: item.event.name,
      ticket_type_name: item.ticketType.name,
    }))

    // Appel à la fonction edge Supabase pour la création sécurisée de la commande
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        customer_name: formData.value.customerName,
        customer_email: formData.value.customerEmail,
        customer_phone: formData.value.customerPhone,
        items: orderItems,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create order')
    }

    const result = await response.json()

    // Vide le panier et redirige vers la page de confirmation
    cartStore.clearCart()
    router.push({
      name: 'confirmation',
      state: {
        orderIds: result.qrCodes.map((qc: { orderId: string }) => qc.orderId),
        orderNumber: result.orderNumber,
        customerEmail: formData.value.customerEmail,
        isFree: result.paymentStatus === 'completed',
        qrCodes: result.qrCodes,
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    toast.error(
      error instanceof Error ? error.message : 'Failed to process your order. Please try again.',
    )
  } finally {
    isLoading.value = false
  }
}

// Calcul du prix d'un item
const getItemPrice = (item: (typeof items.value)[0]) => {
  const price = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
  return price * item.quantity
}

// Redirige vers le panier si vide
onMounted(() => {
  if (items.value.length === 0) {
    router.push('/cart')
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <HeaderView />

    <div class="container py-8 max-w-2xl">
      <button variant="ghost" class="mb-6 text-muted-foreground hover:text-foreground transition-colors"
        @click="goBack">
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4 mr-2" />
        Retour au panier
      </button>

      <h1 class="font-display text-3xl font-bold text-foreground mb-8">Caisse</h1>

      <div class="space-y-6">
        <!-- Order Summary -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-display text-lg font-semibold text-foreground mb-4">Résumé de commande</h3>
          <div class="space-y-3">
            <div v-for="item in items" :key="item.ticketType.id" class="flex justify-between">
              <div>
                <p class="text-foreground">{{ item.event.name }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ item.ticketType.name }} x{{ item.quantity }}
                </p>
              </div>
              <p class="font-semibold text-foreground">€{{ getItemPrice(item).toFixed(2) }}</p>
            </div>
            <div class="border-t border-border pt-3 flex justify-between">
              <span class="font-semibold text-foreground">Total</span>
              <span class="font-display text-xl font-bold text-primary">
                {{ isFree ? 'Gratuit' : `€${totalPrice.toFixed(2)}` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-display text-lg font-semibold text-foreground mb-4">Vos informations</h3>
          <div class="space-y-4">
            <div class="space-y-2">
              <label for="name" class="text-foreground font-medium">Nom & Prenoms</label>
              <input id="name" v-model="formData.customerName" type="text" placeholder="John Doe"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerName }" />
              <p v-if="errors.customerName" class="text-sm text-destructive">
                {{ errors.customerName }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="email" class="text-foreground font-medium">Email</label>
              <input id="email" v-model="formData.customerEmail" type="email" placeholder="john@example.com"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerEmail }" />
              <p v-if="errors.customerEmail" class="text-sm text-destructive">
                {{ errors.customerEmail }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="phone" class="text-foreground font-medium">Numéro de téléphone</label>
              <input id="phone" v-model="formData.customerPhone" type="tel" placeholder="+33 6 12 34 56 78"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerPhone }" />
              <p v-if="errors.customerPhone" class="text-sm text-destructive">
                {{ errors.customerPhone }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSubmit" :disabled="isLoading">
          <FontAwesomeIcon v-if="isLoading" :icon="faSpinner" class="h-4 w-4 mr-2 animate-spin" />
          <FontAwesomeIcon v-else :icon="faCreditCard" class="h-4 w-4 mr-2" />
          {{
            isLoading
              ? 'Traitement...'
              : isFree
                ? 'Confirmer l\'inscription'
                : `Procéder au paiement - €${totalPrice.toFixed(2)}`
          }}
        </button>
      </div>
    </div>
  </div>
</template>
