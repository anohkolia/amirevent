<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-card border-border rounded-md">
      <header class="text-center p-6">
        <div class="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
          <span class="text-primary-foreground">🎫</span>
        </div>
        <h2 class="font-display text-2xl text-foreground">Créer un compte Admin</h2>
        <p class="text-muted-foreground">Inscription pour administrateurs</p>
      </header>

      <main class="p-6">
        <section aria-labelledby="register-heading">
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <label for="register-email" class="text-foreground">Email</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">✉️</span>
                <input id="register-email" type="email" v-model="email" placeholder="admin@example.com"
                  class="pl-10 bg-input border-border text-foreground w-full rounded" required />
              </div>
            </div>

            <div class="space-y-2">
              <label for="register-password" class="text-foreground">Mot de passe</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔒</span>
                <input id="register-password" type="password" v-model="password" placeholder="••••••••"
                  class="pl-10 bg-input border-border text-foreground w-full rounded" required />
              </div>
            </div>

            <div class="space-y-2">
              <label for="register-password-confirm" class="text-foreground">Confirmer le mot de passe</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔒</span>
                <input id="register-password-confirm" type="password" v-model="passwordConfirm" placeholder="••••••••"
                  class="pl-10 bg-input border-border text-foreground w-full rounded" required />
              </div>
            </div>

            <button type="submit" class="w-full py-2 px-4 rounded bg-primary text-primary-foreground"
              :disabled="isLoading">
              <span v-if="isLoading" class="inline-flex items-center">
                <span
                  class="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
                Création en cours...
              </span>
              <span v-else>Créer le compte admin</span>
            </button>
          </form>

          <div class="mt-4 text-center">
            <router-link to="/admin/login" class="text-primary text-sm">
              Déjà un compte ? Se connecter
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
const passwordConfirm = ref('')

const handleRegister = async () => {
  if (password.value !== passwordConfirm.value) {
    toast.error('Les mots de passe ne correspondent pas')
    return
  }

  if (password.value.length < 6) {
    toast.error('Le mot de passe doit contenir au moins 6 caractères')
    return
  }

  isLoading.value = true
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    const userId = data.user?.id
    if (!userId) throw new Error('Aucun utilisateur créé')

    const { error: roleError } = await supabase.rpc('create_admin_role')

    if (roleError) {
      console.error('Erreur lors de la création du rôle:', roleError)
      toast.error('Compte créé mais le rôle admin n\'a pas pu être attribué. Contactez un administrateur.')
      return
    }

    toast.success('Compte admin créé avec succès!')
    router.push('/admin/login')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Échec de l\'inscription')
  } finally {
    isLoading.value = false
  }
}
</script>
