<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-card">
      <div class="container flex h-16 items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span class="text-primary-foreground">🎟️</span>
          </div>
          <span class="font-display text-xl font-bold text-foreground">Admin Dashboard</span>
        </div>
        <div class="flex items-center gap-4">
          <router-link to="/">
            <button class="py-1 px-3 rounded bg-transparent text-sm">Voir le site</button>
          </router-link>
          <button class="py-1 px-3 rounded border" @click="handleLogout">Déconnexion</button>
        </div>
      </div>
    </header>

    <div class="container py-8">
      <div v-if="isLoading" class="min-h-[200px] flex items-center justify-center">
        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-card border-border p-4 rounded">
            <div class="flex items-center justify-between pb-2">
              <div class="text-sm font-medium text-muted-foreground">Événements total</div>
              <div class="text-primary">📅</div>
            </div>
            <div class="text-2xl font-bold text-foreground">{{ stats.totalEvents }}</div>
          </div>

          <div class="bg-card border-border p-4 rounded">
            <div class="flex items-center justify-between pb-2">
              <div class="text-sm font-medium text-muted-foreground">Billets vendus</div>
              <div class="text-primary">🎫</div>
            </div>
            <div class="text-2xl font-bold text-foreground">{{ stats.totalSold }}</div>
          </div>

          <div class="bg-card border-border p-4 rounded">
            <div class="flex items-center justify-between pb-2">
              <div class="text-sm font-medium text-muted-foreground">Commandes totales</div>
              <div class="text-primary">👥</div>
            </div>
            <div class="text-2xl font-bold text-foreground">{{ stats.totalOrders }}</div>
          </div>

          <div class="bg-card border-border p-4 rounded">
            <div class="flex items-center justify-between pb-2">
              <div class="text-sm font-medium text-muted-foreground">Revenue</div>
              <div class="text-primary">💶</div>
            </div>
            <div class="text-2xl font-bold text-foreground">
              €{{ stats.totalRevenue.toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <router-link to="/admin/events">
            <div class="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer p-6 rounded">
              <div class="p-6 flex items-center gap-4">
                <div class="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  📅
                </div>
                <div>
                  <h3 class="font-semibold text-foreground">Gérer les événements</h3>
                  <p class="text-sm text-muted-foreground">Créer, modifier et publier des événements</p>
                </div>
              </div>
            </div>
          </router-link>

          <router-link to="/admin/orders">
            <div class="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer p-6 rounded">
              <div class="p-6 flex items-center gap-4">
                <div class="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  👥
                </div>
                <div>
                  <h3 class="font-semibold text-foreground">Voir les commandes</h3>
                  <p class="text-sm text-muted-foreground">Suivre les ventes et les informations clients</p>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const router = useRouter()
const isLoading = ref(true)
const stats = reactive({ totalEvents: 0, totalOrders: 0, totalRevenue: 0, totalSold: 0 })

const checkAdmin = async () => {
  console.log('[AdminDashboard] checkAdmin() started')

  // Attend que la session soit restaurée
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  console.log('[AdminDashboard] Session check:', session ? 'Session found' : 'No session', sessionError)

  if (sessionError) {
    console.error('[AdminDashboard] Session error:', sessionError)
  }

  if (!session) {
    // Session non disponible pour le moment, veuillez patienter quelques instants et réessayer.
    console.log('[AdminDashboard] No session, waiting 500ms for session restore...')
    await new Promise(resolve => setTimeout(resolve, 500))

    // Vérifiez à nouveau après avoir attendu.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[AdminDashboard] Still no user after waiting, redirecting to login')
      router.push('/admin/login')
      return false
    }
    console.log('[AdminDashboard] User found after waiting:', user.email)
  } else {
    console.log('[AdminDashboard] Session user:', session.user.email)
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('[AdminDashboard] getUser result:', user?.email || 'No user', userError)

  if (userError) {
    console.error('[AdminDashboard] getUser error:', userError)
  }

  if (!user) {
    console.log('[AdminDashboard] No user, redirecting to login (NOT calling signOut)')
    router.push('/admin/login')
    return false
  }

  console.log('[AdminDashboard] Checking admin role for user:', user.id)
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleError) {
    console.error('[AdminDashboard] Role check error:', roleError)
  }

  console.log('[AdminDashboard] Role data:', roleData)

  if (!roleData) {
    toast.error('Accès refusé - Vous ne disposez pas des autorisations d\'administrateur.')
    console.log('[AdminDashboard] No admin role, calling signOut() and redirecting')
    
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/admin/login')
    return false
  }

  console.log('[AdminDashboard] Admin check PASSED!')
  return true
}

const fetchStats = async () => {
  try {
    const [eventsRes, ordersRes, ticketsRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('orders').select('total_price').eq('payment_status', 'completed'),
      supabase.from('ticket_types').select('sold'),
    ])

    stats.totalEvents = eventsRes.count || 0
    stats.totalOrders = ordersRes.data?.length || 0
    stats.totalRevenue =
      ordersRes.data?.reduce(
        (sum: number, o: { total_price?: number | string }) => sum + Number(o.total_price || 0),
        0,
      ) || 0
    stats.totalSold =
      ticketsRes.data?.reduce(
        (sum: number, t: { sold?: number }) => sum + Number(t.sold || 0),
        0,
      ) || 0
  } catch (err) {
    console.error(err)
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/admin/login')
}

onMounted(async () => {
  const ok = await checkAdmin()
  if (ok) await fetchStats()
  isLoading.value = false
})
</script>

