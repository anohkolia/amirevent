<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import { onMounted } from 'vue'
import { supabase } from '@/integrations/supabase/client'

onMounted(() => {
  // Surveille les changements d'état d'authentification pour gérer correctement la session.
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[App] Auth state change:', event, session?.user?.email || 'No user')
  })
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <HeaderView />
    <main id="main-content" tabindex="-1" class="flex-1 focus:outline-none">
      <RouterView />
    </main>
    <FooterView />
  </div>
</template>

<style scoped>
.skip-link {
  position: absolute;
  left: 1rem;
  top: -4rem;
  z-index: 100;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: 0.6rem 0.8rem;
  font-weight: 600;
}

.skip-link:focus {
  top: 1rem;
}
</style>
