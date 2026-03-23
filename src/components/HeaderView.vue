<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTicket, faCartShopping } from '@fortawesome/free-solid-svg-icons'

const cartStore = useCartStore()
const totalItems = computed(() => cartStore.getTotalItems())
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
  >
    <div class="app-container flex h-[4.5rem] items-center justify-between py-3">
      <RouterLink to="/" class="group inline-flex items-center gap-3" aria-label="Retour à l'accueil">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_hsl(142_71%_58%_/_0.4)] transition-transform group-hover:scale-105"
        >
          <FontAwesomeIcon :icon="faTicket" class="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <div>
          <span class="font-display text-xl font-bold tracking-tight text-foreground">AMIRevent</span>
          <p class="hidden text-xs text-muted-foreground sm:block">Billetterie événementielle moderne</p>
        </div>
      </RouterLink>

      <nav class="flex items-center gap-2 sm:gap-3" aria-label="Navigation principale">
        <RouterLink to="/" class="btn btn-ghost hidden text-sm sm:inline-flex">Événements</RouterLink>
        <RouterLink
          to="/cart"
          class="btn btn-secondary relative px-3 text-sm"
          :aria-label="`Panier: ${totalItems} article${totalItems > 1 ? 's' : ''}`"
        >
          <FontAwesomeIcon :icon="faCartShopping" class="h-4 w-4" aria-hidden="true" />
          Panier
          <span
            v-if="totalItems > 0"
            class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground"
            aria-live="polite"
          >
            {{ totalItems }}
          </span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
