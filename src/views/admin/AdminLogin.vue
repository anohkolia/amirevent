<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-card border-border rounded-md">
      <header class="text-center p-6">
        <div class="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
          <span class="text-primary-foreground">🎫</span>
        </div>
        <h2 class="font-display text-2xl text-foreground">Portail Administrateur</h2>
        <p class="text-muted-foreground">Connectez-vous pour gérer les événements et commandes</p>
      </header>

      <main class="p-6">
        <section aria-labelledby="login-heading">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <label for="login-email" class="text-foreground">Email</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">✉️</span>
                <input id="login-email" type="email" v-model="email" placeholder="admin@example.com"
                  class="pl-10 bg-input border-border text-foreground w-full rounded" required />
              </div>
            </div>

            <div class="space-y-2">
              <label for="login-password" class="text-foreground">Mot de passe</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔒</span>
                <input id="login-password" type="password" v-model="password" placeholder="••••••••"
                  class="pl-10 bg-input border-border text-foreground w-full rounded" required />
              </div>
            </div>

            <button type="submit" class="w-full py-2 px-4 rounded bg-primary text-primary-foreground"
              :disabled="isLoading">
              <span v-if="isLoading" class="inline-flex items-center">
                <span
                  class="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
                Connexion en cours...
              </span>
              <span v-else>Se connecter</span>
            </button>
          </form>

          <div class="mt-4 text-center">
            <router-link to="/admin/register" class="text-primary text-sm">
              Créer un compte admin
            </router-link>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const router = useRouter()
const isLoading = ref(false)
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  isLoading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    const userId = (data as unknown as { user?: { id?: string } })?.user?.id
    if (!userId) throw new Error('No user returned')

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      toast.error("Vous n'avez pas d'accès administrateur")
      return
    }

    toast.success('Contant de vous revoir !')
    router.push('/admin')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Échec de connexion')
  } finally {
    isLoading.value = false
  }
}
</script>
