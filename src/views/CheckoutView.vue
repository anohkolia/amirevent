<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import HeaderView from '@/components/HeaderView.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft, faCreditCard, faSpinner } from '@fortawesome/free-solid-svg-icons'

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
const orderIds = ref<string[]>([])

const validateForm = (): boolean => {
  const newErrors: FormErrors = {}
  let isValid = true

  // Name validation
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

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.customerEmail.trim()) {
    newErrors.customerEmail = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(formData.value.customerEmail)) {
    newErrors.customerEmail = 'Invalid email address'
    isValid = false
  }

  // Phone validation
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

const handleSubmit = async () => {
  if (!validateForm()) return
  if (items.value.length === 0) {
    router.push('/cart')
    return
  }

  isLoading.value = true

  try {
    // Simulate order creation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock order IDs
    orderIds.value = items.value.map(
      () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    )

    // Clear cart and navigate to confirmation
    cartStore.clearCart()
    router.push({
      name: 'confirmation',
      state: {
        orderIds: orderIds.value,
        customerEmail: formData.value.customerEmail,
        isFree: isFree.value,
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    alert('Failed to process your order. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const getItemPrice = (item: (typeof items.value)[0]) => {
  const price = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
  return price * item.quantity
}

// Redirect to cart if empty
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
      <button
        variant="ghost"
        class="mb-6 text-muted-foreground hover:text-foreground transition-colors"
        @click="goBack"
      >
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4 mr-2" />
        Back to Cart
      </button>

      <h1 class="font-display text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <div class="space-y-6">
        <!-- Order Summary -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-display text-lg font-semibold text-foreground mb-4">Order Summary</h3>
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
                {{ isFree ? 'Free' : `€${totalPrice.toFixed(2)}` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="font-display text-lg font-semibold text-foreground mb-4">Your Information</h3>
          <div class="space-y-4">
            <div class="space-y-2">
              <label for="name" class="text-foreground font-medium">Full Name</label>
              <input
                id="name"
                v-model="formData.customerName"
                type="text"
                placeholder="John Doe"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerName }"
              />
              <p v-if="errors.customerName" class="text-sm text-destructive">
                {{ errors.customerName }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="email" class="text-foreground font-medium">Email</label>
              <input
                id="email"
                v-model="formData.customerEmail"
                type="email"
                placeholder="john@example.com"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerEmail }"
              />
              <p v-if="errors.customerEmail" class="text-sm text-destructive">
                {{ errors.customerEmail }}
              </p>
            </div>

            <div class="space-y-2">
              <label for="phone" class="text-foreground font-medium">Phone Number</label>
              <input
                id="phone"
                v-model="formData.customerPhone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                class="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                :class="{ 'border-destructive': errors.customerPhone }"
              />
              <p v-if="errors.customerPhone" class="text-sm text-destructive">
                {{ errors.customerPhone }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSubmit"
          :disabled="isLoading"
        >
          <FontAwesomeIcon v-if="isLoading" :icon="faSpinner" class="h-4 w-4 mr-2 animate-spin" />
          <FontAwesomeIcon v-else :icon="faCreditCard" class="h-4 w-4 mr-2" />
          {{
            isLoading
              ? 'Processing...'
              : isFree
                ? 'Confirm Registration'
                : `Proceed to Payment - €${totalPrice.toFixed(2)}`
          }}
        </button>
      </div>
    </div>
  </div>
</template>
