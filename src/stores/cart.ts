import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Event, TicketType } from './events'

export interface CartItem {
  id: number
  event: Event
  ticketType: TicketType
  quantity: number
  isMember: boolean
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => {
      const price = item.isMember ? item.ticketType.price * 0.8 : item.ticketType.price
      return sum + price * item.quantity
    }, 0)
  })

  function addItem(
    event: Event,
    ticketType: TicketType,
    quantity: number,
    isMember: boolean = false,
  ) {
    const existingItem = items.value.find((item) => item.ticketType.id === ticketType.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: ticketType.id,
        event,
        ticketType,
        quantity,
        isMember,
      })
    }
  }

  function removeItem(ticketTypeId: number) {
    const index = items.value.findIndex((item) => item.ticketType.id === ticketTypeId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  function updateQuantity(ticketTypeId: number, quantity: number) {
    const item = items.value.find((item) => item.ticketType.id === ticketTypeId)
    if (item) {
      if (quantity <= 0) {
        removeItem(ticketTypeId)
      } else {
        item.quantity = quantity
      }
    }
  }

  function clearCart() {
    items.value = []
  }

  function getTotalItems() {
    return totalItems.value
  }

  function getTotalPrice() {
    return totalPrice.value
  }

  return {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }
})
