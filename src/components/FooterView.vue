<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faEnvelope, faLocationDot, faPhone, faTicket } from '@fortawesome/free-solid-svg-icons'

const cartStore = useCartStore()
const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="border-t border-border/60 bg-background/70 backdrop-blur-sm">
    <div class="app-container py-12 md:py-14">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-10">
        <div class="space-y-4">
          <RouterLink to="/" class="inline-flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <FontAwesomeIcon :icon="faTicket" class="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span class="font-display text-xl font-bold text-foreground">AMIRevent</span>
          </RouterLink>
          <p class="text-sm text-muted-foreground">
            La plateforme de billetterie conçue pour découvrir, réserver et gérer vos expériences en quelques clics.
          </p>
        </div>

        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Liens rapides</h4>
          <nav class="flex flex-col gap-2 text-sm" aria-label="Liens rapides">
            <RouterLink to="/" class="text-muted-foreground hover:text-foreground transition-colors">
              Accueil
            </RouterLink>
            <RouterLink to="/cart" class="text-muted-foreground hover:text-foreground transition-colors">
              Panier ({{ cartStore.getTotalItems() }})
            </RouterLink>
            <RouterLink to="/checkout" class="text-muted-foreground hover:text-foreground transition-colors">
              Paiement
            </RouterLink>
          </nav>
        </div>

        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Administration</h4>
          <nav class="flex flex-col gap-2 text-sm" aria-label="Espace administration">
            <RouterLink to="/admin/login" class="text-muted-foreground hover:text-foreground transition-colors">
              Connexion admin
            </RouterLink>
          </nav>
        </div>

        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Contact</h4>
          <div class="space-y-2 text-sm text-muted-foreground">
            <a href="mailto:contact@amirevent.com" class="inline-flex items-center gap-2 hover:text-foreground">
              <FontAwesomeIcon :icon="faEnvelope" class="h-4 w-4" aria-hidden="true" />
              contact@amirevent.com
            </a>
            <p class="inline-flex items-center gap-2">
              <FontAwesomeIcon :icon="faLocationDot" class="h-4 w-4" aria-hidden="true" />
              Rennes, France
            </p>
            <a href="tel:+2290100000000" class="inline-flex items-center gap-2 hover:text-foreground">
              <FontAwesomeIcon :icon="faPhone" class="h-4 w-4" aria-hidden="true" />
              +33 01 00 00 00 00
            </a>
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-border/50 pt-6">
        <div
          class="flex flex-col items-start justify-between gap-3 text-sm text-muted-foreground md:flex-row md:items-center"
        >
          <p>&copy; {{ currentYear }} AMIRevent. Tous droits réservés.</p>
          <p>Protection des données et paiements sécurisés.</p>
        </div>
      </div>
    </div>
  </footer>
</template>
