<script setup lang="ts">
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheck, faMinus, faPlus, faUsers } from '@fortawesome/free-solid-svg-icons'
import { useCartStore } from '@/stores/cart'
import { useEventsStore, type Event, type TicketType } from '@/stores/events'

interface TicketSelectorProps {
  event: Event
}

const props = defineProps<TicketSelectorProps>()
const cartStore = useCartStore()
const eventsStore = useEventsStore()

const selectedTicket = ref<TicketType | null>(null)
const quantity = ref(1)
const isMember = ref(false)
const feedback = ref<{ kind: 'success' | 'error'; message: string } | null>(null)

const ticketTypes = computed(() => eventsStore.ticketTypes[props.event.id] || [])
const memberCheckboxId = computed(() => `member-discount-${props.event.id}`)

const getAvailableTickets = (ticket: TicketType) => Math.max(ticket.capacity - ticket.sold, 0)
const isSoldOut = (ticket: TicketType) => getAvailableTickets(ticket) <= 0
const isSelected = (ticket: TicketType) => selectedTicket.value?.id === ticket.id

const totalPrice = computed(() => {
  if (!selectedTicket.value) return 0
  const basePrice = isMember.value ? selectedTicket.value.price * 0.8 : selectedTicket.value.price
  return basePrice * quantity.value
})

const selectTicket = (ticket: TicketType) => {
  if (isSoldOut(ticket)) return
  selectedTicket.value = ticket
  quantity.value = 1
  feedback.value = null
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  if (!selectedTicket.value) return
  const available = getAvailableTickets(selectedTicket.value)
  if (quantity.value < available) quantity.value++
}

const handleAddToCart = () => {
  if (!selectedTicket.value) return
  const available = getAvailableTickets(selectedTicket.value)

  if (quantity.value > available) {
    feedback.value = {
      kind: 'error',
      message: `Seulement ${available} billet(s) disponible(s) pour ce tarif.`,
    }
    return
  }

  cartStore.addItem(props.event, selectedTicket.value, quantity.value, isMember.value)
  feedback.value = {
    kind: 'success',
    message: `${quantity.value} billet(s) ajouté(s) au panier.`,
  }

  quantity.value = 1
  selectedTicket.value = null
  isMember.value = false
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="font-display text-lg font-semibold text-foreground">Choisir vos billets</h3>

    <div v-if="eventsStore.loading" class="space-y-3" aria-hidden="true">
      <div v-for="i in 2" :key="i" class="animate-pulse rounded-xl border border-border p-4">
        <div class="mb-2 h-6 w-3/4 rounded bg-muted" />
        <div class="h-4 w-1/2 rounded bg-muted" />
      </div>
    </div>

    <div v-else-if="ticketTypes.length === 0" class="rounded-xl border border-border/60 bg-muted/20 py-8 text-center text-muted-foreground">
      Aucun billet disponible pour cet événement.
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="ticket in ticketTypes"
        :key="ticket.id"
        type="button"
        class="w-full rounded-xl border p-4 text-left transition-all"
        :class="{
          'border-primary bg-primary/8': isSelected(ticket),
          'border-border hover:border-primary/50': !isSelected(ticket) && !isSoldOut(ticket),
          'cursor-not-allowed border-border/50 opacity-[0.55]': isSoldOut(ticket),
        }"
        :disabled="isSoldOut(ticket)"
        @click="selectTicket(ticket)"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full border-2"
              :class="{ 'border-primary bg-primary': isSelected(ticket), 'border-muted-foreground': !isSelected(ticket) }"
              aria-hidden="true"
            >
              <FontAwesomeIcon v-if="isSelected(ticket)" :icon="faCheck" class="h-3 w-3 text-primary-foreground" />
            </div>
            <div>
              <p class="font-semibold text-foreground">{{ ticket.name }}</p>
              <div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <FontAwesomeIcon :icon="faUsers" class="h-3 w-3" />
                <span v-if="isSoldOut(ticket)">Épuisé</span>
                <span v-else>{{ getAvailableTickets(ticket) }} place(s) restantes</span>
              </div>
            </div>
          </div>
          <p class="font-display text-lg font-bold text-primary">
            {{ ticket.price === 0 ? 'Gratuit' : `€${ticket.price.toFixed(2)}` }}
          </p>
        </div>
      </button>
    </div>

    <div v-if="selectedTicket" class="space-y-4 border-t border-border pt-4">
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Quantité</span>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="btn btn-secondary h-8 w-8 p-0"
            :disabled="quantity <= 1"
            aria-label="Diminuer la quantité"
            @click="decreaseQuantity"
          >
            <FontAwesomeIcon :icon="faMinus" class="h-3.5 w-3.5" />
          </button>
          <span class="w-8 text-center font-semibold text-foreground">{{ quantity }}</span>
          <button
            type="button"
            class="btn btn-secondary h-8 w-8 p-0"
            :disabled="quantity >= getAvailableTickets(selectedTicket)"
            aria-label="Augmenter la quantité"
            @click="increaseQuantity"
          >
            <FontAwesomeIcon :icon="faPlus" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input
          :id="memberCheckboxId"
          v-model="isMember"
          type="checkbox"
          class="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
        />
        <label :for="memberCheckboxId" class="cursor-pointer text-sm text-muted-foreground">
          Tarif membre (-20%)
        </label>
      </div>

      <div class="flex items-center justify-between border-t border-border py-3">
        <span class="text-muted-foreground">Total</span>
        <span class="font-display text-2xl font-bold text-primary">€{{ totalPrice.toFixed(2) }}</span>
      </div>

      <button type="button" class="btn btn-primary w-full" @click="handleAddToCart">Ajouter au panier</button>
    </div>

    <p
      v-if="feedback"
      class="rounded-lg px-3 py-2 text-sm"
      :class="feedback.kind === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'"
      role="status"
      aria-live="polite"
    >
      {{ feedback.message }}
    </p>
  </div>
</template>
