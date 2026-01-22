<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="border-t border-border/50 bg-background">
    <div class="container py-12 md:py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand Section -->
        <div class="space-y-4">
          <RouterLink to="/" class="flex items-center gap-2">
            <div class="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span class="text-primary-foreground text-xl">🎫</span>
            </div>
            <span class="font-display text-xl font-bold text-foreground">AMIRevent</span>
          </RouterLink>
          <p class="text-sm text-muted-foreground">
            Votre plateforme de billetterie en ligne pensée et conçue pour vous pour tous vos événements.
          </p>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Liens rapides</h4>
          <nav class="flex flex-col space-y-2 text-sm">
            <RouterLink to="/" class="text-muted-foreground hover:text-foreground transition-colors">
              Accueil
            </RouterLink>
            <RouterLink to="/cart" class="text-muted-foreground hover:text-foreground transition-colors">
              Panier ({{ cartStore.getTotalItems() }})
            </RouterLink>
          </nav>
        </div>

        <!-- Admin Section -->
        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Administration</h4>
          <nav class="flex flex-col space-y-2 text-sm">
            <RouterLink to="/admin/login" class="text-muted-foreground hover:text-foreground transition-colors">
              Admin Login
            </RouterLink>
          </nav>
        </div>

        <!-- Contact Info -->
        <div class="space-y-4">
          <h4 class="font-semibold text-foreground">Contacts</h4>
          <div class="space-y-2 text-sm text-muted-foreground">
            <p>📧 contact@amirevent.com</p>
            <p>📍 123 Event Street</p>
            <p>📞 +33 (555) 123-4567</p>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-border/50">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {{ currentYear }} AMIRevent. Tous droits réservés.</p>
          <div class="flex gap-6">
            <RouterLink to="/privacy" class="hover:text-foreground transition-colors">
              Politique de Confidentialité
            </RouterLink>
            <RouterLink to="/terms" class="hover:text-foreground transition-colors">
              Conditions d'utilisation
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
