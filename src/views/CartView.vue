<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faTrash,
  faShoppingCart,
  faArrowLeft,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'

const router = useRouter()
const cartStore = useCartStore()

const items = computed(() => cartStore.items)
const totalPrice = computed(() => cartStore.getTotalPrice())
const isEmpty = computed(() => items.value.length === 0)

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-EU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Fonction pour formater l'heure
const formatTime = (timeString: string) => {
  return timeString.slice(0, 5)
}

// Calcul du prix d'un article (avec réduction membre si applicable)
const getItemPrice = (item: (typeof items.value)[0]) => {
  const price = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
  return price * item.quantity
}

// Suppression d'un article du panier
const removeItem = (ticketTypeId: string) => {
  cartStore.removeItem(ticketTypeId)
}

// Mise à jour de la quantité d'un article dans le panier
const updateQuantity = (ticketTypeId: string, quantity: number) => {
  cartStore.updateQuantity(ticketTypeId, quantity)
}

const clearCart = () => {
  cartStore.clearCart()
}

const proceedToCheckout = () => {
  router.push('/checkout')
}
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- Empty Cart -->
    <div v-if="isEmpty" class="container py-16 text-center">
      <FontAwesomeIcon :icon="faShoppingCart" class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h1 class="font-display text-2xl font-semibold text-foreground mb-2">Votre panier est vide</h1>
      <p class="text-muted-foreground mb-6">Ajoutez quelques billets pour commencer !</p>
      <RouterLink to="/">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium">
          Consultez les événements
        </button>
      </RouterLink>
    </div>

    <!-- Cart Content -->
    <div v-else class="container py-8">
      <RouterLink to="/"
        class="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4" />
        <span>Continuer vos achats</span>
      </RouterLink>

      <h1 class="font-display text-3xl font-bold text-foreground mb-8">Panier</h1>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2 space-y-4">
          <div v-for="item in items" :key="item.ticketType.id" class="bg-card border border-border rounded-lg p-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <h3 class="font-semibold text-foreground mb-1">
                  {{ item.event.name }}
                </h3>
                <p class="text-sm text-muted-foreground mb-2">
                  {{ item.ticketType.name }} - €{{ item.ticketType.price.toFixed(2) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(item.event.date) }} at {{ formatTime(item.event.date) }}
                </p>
                <span v-if="item.isMember"
                  class="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Membre
                </span>
              </div>

              <div class="flex items-center gap-4">
                <!-- Quantity Controls -->
                <div class="flex items-center gap-2">
                  <button variant="outline"
                    class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                    @click="updateQuantity(item.ticketType.id, item.quantity - 1)">
                    <FontAwesomeIcon :icon="faMinus" class="h-3 w-3" />
                  </button>
                  <span class="font-semibold text-foreground w-8 text-center">
                    {{ item.quantity }}
                  </span>
                  <button variant="outline"
                    class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
                    @click="updateQuantity(item.ticketType.id, item.quantity + 1)">
                    <FontAwesomeIcon :icon="faPlus" class="h-3 w-3" />
                  </button>
                </div>

                <!-- Item Total -->
                <p class="font-semibold text-foreground min-w-[80px] text-right">
                  €{{ getItemPrice(item).toFixed(2) }}
                </p>

                <!-- Remove Button -->
                <button variant="ghost" class="text-destructive hover:text-destructive p-2"
                  @click="removeItem(item.ticketType.id)">
                  <FontAwesomeIcon :icon="faTrash" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div>
          <div class="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h3 class="font-display text-lg font-semibold text-foreground mb-4">Résumé de la commande</h3>

            <div class="space-y-3 mb-6">
              <div v-for="item in items" :key="item.ticketType.id" class="flex justify-between text-sm">
                <span class="text-muted-foreground">
                  {{ item.ticketType.name }} x{{ item.quantity }}
                </span>
                <span class="text-foreground"> €{{ getItemPrice(item).toFixed(2) }} </span>
              </div>
            </div>

            <div class="border-t border-border pt-4 mb-6">
              <div class="flex justify-between">
                <span class="font-semibold text-foreground">Total</span>
                <span class="font-display text-2xl font-bold text-primary">
                  €{{ totalPrice.toFixed(2) }}
                </span>
              </div>
            </div>

            <button
              class="w-full py-3 px-4 mb-2 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
              @click="proceedToCheckout">
              Passer à la caisse
            </button>

            <button variant="ghost" class="w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
              @click="clearCart">
              Vider le panier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
