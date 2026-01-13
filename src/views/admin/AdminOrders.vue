<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-card">
      <div class="container flex h-16 items-center justify-between">
        <router-link to="/admin" class="text-muted-foreground inline-flex items-center">
          <!-- simple back text instead of icon -->
          <span class="mr-2">←</span>
          <span>Back to Dashboard</span>
        </router-link>
      </div>
    </header>

    <div class="container py-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 class="font-display text-3xl font-bold text-foreground">Orders</h1>
        <div class="relative max-w-sm w-full">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            >🔍</span
          >
          <input
            v-model="searchQuery"
            placeholder="Search orders..."
            class="pl-10 bg-input border-border text-foreground w-full rounded"
            aria-label="Search orders"
          />
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div
          class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>

      <div v-else>
        <div v-if="filteredOrders.length === 0" class="text-center py-16">
          <h3 class="font-display text-xl font-semibold text-foreground mb-2">No orders found</h3>
          <p class="text-muted-foreground">
            {{
              searchQuery
                ? 'Try adjusting your search'
                : 'Orders will appear here once customers make purchases'
            }}
          </p>
        </div>

        <div v-else class="bg-card border-border overflow-hidden rounded">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left">
              <thead class="text-muted-foreground">
                <tr class="border-border">
                  <th class="px-4 py-2">Customer</th>
                  <th class="px-4 py-2">Event</th>
                  <th class="px-4 py-2">Ticket</th>
                  <th class="px-4 py-2">Qty</th>
                  <th class="px-4 py-2">Total</th>
                  <th class="px-4 py-2">Status</th>
                  <th class="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="order.id" class="border-border">
                  <td class="px-4 py-3">
                    <div>
                      <p class="font-medium text-foreground">{{ order.customer_name }}</p>
                      <p class="text-sm text-muted-foreground">{{ order.customer_email }}</p>
                      <p class="text-sm text-muted-foreground">{{ order.customer_phone }}</p>
                      <span
                        v-if="order.is_member"
                        class="inline-block mt-1 text-xs px-2 py-0.5 border rounded"
                        >Member</span
                      >
                    </div>
                  </td>
                  <td class="px-4 py-3 text-foreground">{{ order.events?.name || 'N/A' }}</td>
                  <td class="px-4 py-3 text-foreground">{{ order.ticket_types?.name || 'N/A' }}</td>
                  <td class="px-4 py-3 text-foreground">{{ order.quantity }}</td>
                  <td class="px-4 py-3 text-foreground font-medium">
                    €{{ Number(order.total_price).toFixed(2) }}
                  </td>
                  <td class="px-4 py-3">
                    <span :class="statusClass(order.payment_status)">{{
                      order.payment_status
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-muted-foreground">
                    {{ formatDate(order.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'

const router = useRouter()
interface OrderItem {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  is_member?: boolean
  events?: { name?: string }
  ticket_types?: { name?: string }
  quantity?: number
  total_price?: number | string
  payment_status?: string
  created_at?: string
}

const isAdmin = ref(false)
const searchQuery = ref('')
const orders = ref<OrderItem[]>([])
const isLoading = ref(true)

const checkAdmin = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    router.push('/admin/login')
    return
  }
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleData) {
    await supabase.auth.signOut()
    router.push('/admin/login')
    return
  }

  isAdmin.value = true
}

const fetchOrders = async () => {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        events (name),
        ticket_types (name)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    orders.value = data || []
  } catch (err: unknown) {
    console.error(err)
    orders.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await checkAdmin()
  if (isAdmin.value) {
    await fetchOrders()
  } else {
    isLoading.value = false
  }
})

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return orders.value || []
  return (orders.value || []).filter((order) => {
    return (
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.customer_email || '').toLowerCase().includes(q) ||
      (order.events?.name || '').toLowerCase().includes(q)
    )
  })
})

const formatDate = (d: string | null | undefined) => {
  if (!d) return ''
  try {
    return format(new Date(d), 'MMM d, yyyy HH:mm')
  } catch (err: unknown) {
    console.warn(err)
    return d
  }
}

const statusClass = (status: string | undefined) => {
  if (!status) return 'inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-sm'
  if (status === 'completed')
    return 'inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-sm'
  if (status === 'pending')
    return 'inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-sm'
  return 'inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-sm'
}
</script>

<!-- Styles are intentionally omitted — project global styles and Tailwind handle styling -->
