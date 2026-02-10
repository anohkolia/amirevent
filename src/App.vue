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
  <div class="min-h-screen flex flex-col">
    <HeaderView />
    <main class="flex-1">
      <RouterView />
    </main>
    <FooterView />
  </div>
</template>
