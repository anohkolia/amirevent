<script setup lang="ts">
import { ref, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUsers, faCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
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

const ticketTypes = computed(() => {
  return eventsStore.ticketTypes[props.event.id] || []
})

const totalPrice = computed(() => {
  if (!selectedTicket.value) return 0
  const price = isMember.value ? selectedTicket.value.price * 0.8 : selectedTicket.value.price
  return price * quantity.value
})

const getAvailableTickets = (ticket: TicketType) => {
  return ticket.capacity - ticket.sold
}

const isSoldOut = (ticket: TicketType) => {
  return getAvailableTickets(ticket) <= 0
}

const isSelected = (ticket: TicketType) => {
  return selectedTicket.value?.id === ticket.id
}

const selectTicket = (ticket: TicketType) => {
  if (isSoldOut(ticket)) return
  selectedTicket.value = ticket
  quantity.value = 1
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const increaseQuantity = () => {
  if (selectedTicket.value) {
    const available = getAvailableTickets(selectedTicket.value)
    if (quantity.value < available) {
      quantity.value++
    }
  }
}

const handleAddToCart = () => {
  if (!selectedTicket.value) return

  const available = getAvailableTickets(selectedTicket.value)
  if (quantity.value > available) {
    alert(`Only ${available} tickets available`)
    return
  }

  cartStore.addItem(props.event, selectedTicket.value, quantity.value, isMember.value)
  alert(`${quantity.value} ticket(s) added to cart!`)

  // Reset after adding
  quantity.value = 1
  selectedTicket.value = null
  isMember.value = false
}

// Fetch ticket types on mount
eventsStore.fetchTicketTypes(props.event.id)
</script>

<template>
  <div class="space-y-4">
    <h3 class="font-display text-lg font-semibold text-foreground">Select Tickets</h3>

    <div v-if="eventsStore.loading" class="space-y-3">
      <div v-for="i in 2" :key="i" class="p-4 border border-border rounded-lg animate-pulse">
        <div class="h-6 w-3/4 bg-muted rounded mb-2"></div>
        <div class="h-4 w-1/2 bg-muted rounded"></div>
      </div>
    </div>

    <div v-else-if="ticketTypes.length === 0" class="text-center py-8 text-muted-foreground">
      No tickets available for this event.
    </div>

    <div v-else class="space-y-3">
      <div v-for="ticket in ticketTypes" :key="ticket.id" class="cursor-pointer transition-all border rounded-lg p-4"
        :class="{
          'border-primary bg-primary/5': isSelected(ticket),
          'border-border hover:border-primary/50': !isSelected(ticket) && !isSoldOut(ticket),
          'border-border/50 opacity-50 cursor-not-allowed': isSoldOut(ticket),
        }" @click="selectTicket(ticket)">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-5 w-5 rounded-full border-2 flex items-center justify-center" :class="{
              'border-primary bg-primary': isSelected(ticket),
              'border-muted-foreground': !isSelected(ticket),
            }">
              <FontAwesomeIcon v-if="isSelected(ticket)" :icon="faCheck" class="h-3 w-3 text-primary-foreground" />
            </div>
            <div>
              <p class="font-semibold text-foreground">{{ ticket.name }}</p>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <FontAwesomeIcon :icon="faUsers" class="h-3 w-3" />
                <span v-if="isSoldOut(ticket)">Sold out</span>
                <span v-else>{{ getAvailableTickets(ticket) }} left</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="font-display text-xl font-bold text-primary">
              {{ ticket.price === 0 ? 'Free' : `€${ticket.price.toFixed(2)}` }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedTicket" class="space-y-4 pt-4 border-t border-border">
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Quantity</span>
        <div class="flex items-center gap-3">
          <button variant="outline"
            class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
            @click="decreaseQuantity">
            <FontAwesomeIcon :icon="faMinus" class="h-4 w-4" />
          </button>
          <span class="font-semibold text-foreground w-8 text-center">
            {{ quantity }}
          </span>
          <button variant="outline"
            class="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
            @click="increaseQuantity">
            <FontAwesomeIcon :icon="faPlus" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" id="member" v-model="isMember"
          class="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary" />
        <label for="member" class="text-muted-foreground cursor-pointer text-sm">
          I am a member of the association (20% discount)
        </label>
      </div>

      <div class="flex items-center justify-between py-3 border-t border-border">
        <span class="text-muted-foreground">Total</span>
        <span class="font-display text-2xl font-bold text-primary">
          €{{ totalPrice.toFixed(2) }}
        </span>
      </div>

      <button
        class="w-full py-3 px-4 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
        @click="handleAddToCart">
        Add to Cart
      </button>
    </div>
  </div>
</template>
