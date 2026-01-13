<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTicket, faCartShopping, faUser } from '@fortawesome/free-solid-svg-icons'

const cartStore = useCartStore()
const totalItems = computed(() => cartStore.getTotalItems())
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-16 items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2">
        <div class="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
          <FontAwesomeIcon :icon="faTicket" class="h-5 w-5 text-primary-foreground" />
        </div>
        <span class="font-display text-xl font-bold text-foreground"> EventTix </span>
      </RouterLink>

      <nav class="flex items-center gap-4">
        <RouterLink to="/admin/login">
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
          >
            <FontAwesomeIcon :icon="faUser" class="h-4 w-4 mr-2" />
            Admin
          </button>
        </RouterLink>
        <RouterLink
          to="/cart"
          class="relative inline-flex items-center px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
        >
          <FontAwesomeIcon :icon="faCartShopping" class="h-4 w-4 mr-2" />
          Cart
          <span
            v-if="totalItems > 0"
            class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs rounded-full"
          >
            {{ totalItems }}
          </span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
