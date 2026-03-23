<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faArrowLeft, faMinus, faPlus, faShoppingCart, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const items = computed(() => cartStore.items)
const totalPrice = computed(() => cartStore.getTotalPrice())
const isEmpty = computed(() => items.value.length === 0)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatTime = (timeString?: string | null) => (timeString || '').slice(0, 5)

const getItemPrice = (item: (typeof items.value)[0]) => {
  const unitPrice = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
  return unitPrice * item.quantity
}

const getMaxQuantity = (item: (typeof items.value)[0]) =>
  Math.max((item.ticketType.capacity || 0) - (item.ticketType.sold || 0), 1)

const removeItem = (ticketTypeId: string) => cartStore.removeItem(ticketTypeId)
const updateQuantity = (ticketTypeId: string, quantity: number) =>
  cartStore.updateQuantity(ticketTypeId, quantity)
const clearCart = () => cartStore.clearCart()
const proceedToCheckout = () => router.push('/checkout')
</script>

<template>
  <div class="min-h-screen py-10 md:py-12">
    <div v-if="isEmpty" class="app-container max-w-2xl">
      <section class="panel py-14 text-center">
        <FontAwesomeIcon :icon="faShoppingCart" class="mx-auto h-16 w-16 text-muted-foreground" aria-hidden="true" />
        <h1 class="mt-4 font-display text-2xl font-semibold text-foreground">Votre panier est vide</h1>
        <p class="mt-2 text-muted-foreground">Ajoutez des billets pour continuer vers la réservation.</p>
        <RouterLink to="/" class="btn btn-primary mt-6">Découvrir les événements</RouterLink>
      </section>
    </div>

    <div v-else class="app-container">
      <RouterLink to="/" class="btn btn-ghost mb-5 inline-flex px-0 text-sm">
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4" />
        Continuer vos achats
      </RouterLink>

      <h1 class="font-display text-3xl font-bold text-foreground">Panier</h1>

      <div class="mt-7 grid gap-6 lg:grid-cols-3">
        <section class="space-y-4 lg:col-span-2" aria-label="Articles du panier">
          <article
            v-for="item in items"
            :key="item.ticketType.id"
            class="panel rounded-xl p-4 md:p-5"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="font-semibold text-foreground">{{ item.event.name }}</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ item.ticketType.name }} - €{{ item.ticketType.price.toFixed(2) }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ formatDate(item.event.date) }}
                  <span v-if="formatTime(item.event.time)">• {{ formatTime(item.event.time) }}</span>
                </p>
                <span
                  v-if="item.isMember"
                  class="mt-2 inline-block rounded-full border border-primary/50 bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  Tarif membre
                </span>
              </div>

              <div class="flex items-center gap-3 self-end sm:self-start">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="btn btn-secondary h-8 w-8 p-0"
                    :disabled="item.quantity <= 1"
                    aria-label="Diminuer la quantité"
                    @click="updateQuantity(item.ticketType.id, item.quantity - 1)"
                  >
                    <FontAwesomeIcon :icon="faMinus" class="h-3 w-3" />
                  </button>
                  <span class="w-8 text-center font-semibold text-foreground">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="btn btn-secondary h-8 w-8 p-0"
                    :disabled="item.quantity >= getMaxQuantity(item)"
                    aria-label="Augmenter la quantité"
                    @click="updateQuantity(item.ticketType.id, item.quantity + 1)"
                  >
                    <FontAwesomeIcon :icon="faPlus" class="h-3 w-3" />
                  </button>
                </div>

                <p class="min-w-[5rem] text-right font-semibold text-foreground">€{{ getItemPrice(item).toFixed(2) }}</p>

                <button
                  type="button"
                  class="btn btn-ghost p-2 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                  aria-label="Supprimer cet article"
                  @click="removeItem(item.ticketType.id)"
                >
                  <FontAwesomeIcon :icon="faTrash" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </section>

        <aside class="lg:sticky lg:top-24 lg:h-fit">
          <div class="panel rounded-xl p-6">
            <h2 class="font-display text-lg font-semibold text-foreground">Résumé de commande</h2>

            <div class="mt-4 space-y-3">
              <div v-for="item in items" :key="item.ticketType.id" class="flex justify-between gap-3 text-sm">
                <span class="text-muted-foreground">{{ item.ticketType.name }} x{{ item.quantity }}</span>
                <span class="text-foreground">€{{ getItemPrice(item).toFixed(2) }}</span>
              </div>
            </div>

            <div class="mt-5 border-t border-border pt-4">
              <div class="flex items-end justify-between gap-3">
                <span class="font-semibold text-foreground">Total</span>
                <span class="font-display text-2xl font-bold text-primary">€{{ totalPrice.toFixed(2) }}</span>
              </div>
            </div>

            <button type="button" class="btn btn-primary mt-6 w-full" @click="proceedToCheckout">
              Passer à la caisse
            </button>
            <button type="button" class="btn btn-ghost mt-2 w-full" @click="clearCart">
              Vider le panier
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
