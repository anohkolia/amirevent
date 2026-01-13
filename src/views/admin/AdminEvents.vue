<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border bg-card">
      <div class="container flex h-16 items-center justify-between">
        <router-link to="/admin" class="text-muted-foreground inline-flex items-center">
          <span class="mr-2">←</span>
          <span>Back to Dashboard</span>
        </router-link>
        <router-link to="/admin/events/new">
          <button class="py-2 px-3 rounded bg-primary text-primary-foreground">
            ＋ Create Event
          </button>
        </router-link>
      </div>
    </header>

    <div class="container py-8">
      <h1 class="font-display text-3xl font-bold text-foreground mb-8">Events</h1>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div
          class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>

      <div v-else>
        <div v-if="events.length === 0" class="text-center py-16">
          <h3 class="font-display text-xl font-semibold text-foreground mb-2">No events yet</h3>
          <p class="text-muted-foreground mb-6">Create your first event to get started</p>
          <router-link to="/admin/events/new">
            <button class="py-2 px-3 rounded bg-primary text-primary-foreground">
              ＋ Create Event
            </button>
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div v-for="event in events" :key="event.id" class="bg-card border-border rounded">
            <div class="p-4">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <template v-if="event.image_url">
                    <img
                      :src="event.image_url"
                      :alt="event.name"
                      class="w-16 h-16 rounded-lg object-cover"
                    />
                  </template>
                  <template v-else>
                    <div class="w-16 h-16 rounded-lg bg-secondary" />
                  </template>
                  <div>
                    <h3 class="font-semibold text-foreground">{{ event.name }}</h3>
                    <p class="text-sm text-muted-foreground">
                      {{ formatDate(event.date) }} at {{ (event.time || '').slice(0, 5) }}
                    </p>
                    <p class="text-sm text-muted-foreground">{{ event.location }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span :class="badgeClass(event.is_published)">{{
                    event.is_published ? 'Published' : 'Draft'
                  }}</span>

                  <button class="py-1 px-2 rounded bg-transparent" @click="togglePublish(event)">
                    {{ event.is_published ? 'Unpublish' : 'Publish' }}
                  </button>

                  <router-link :to="`/admin/events/${event.id}`">
                    <button class="py-1 px-2 rounded bg-transparent">Edit</button>
                  </router-link>

                  <button class="py-1 px-2 rounded text-destructive" @click="confirmDelete(event)">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface EventItem {
  id: string
  name: string
  date?: string | null
  time?: string | null
  location?: string | null
  image_url?: string | null
  is_published?: boolean
}

const router = useRouter()
const isAdmin = ref(false)
const events = ref<EventItem[]>([])
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
    router.push('/admin/login')
    return
  }
  isAdmin.value = true
}

const fetchEvents = async () => {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) throw error
    events.value = (data || []) as EventItem[]
  } catch (err) {
    console.error(err)
    events.value = []
  } finally {
    isLoading.value = false
  }
}

const togglePublish = async (event: EventItem) => {
  try {
    await supabase.from('events').update({ is_published: !event.is_published }).eq('id', event.id)
    toast.success('Event updated')
    await fetchEvents()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Failed to update event')
  }
}

const confirmDelete = async (event: EventItem) => {
  const ok = window.confirm(
    `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
  )
  if (!ok) return
  try {
    await supabase.from('events').delete().eq('id', event.id)
    toast.success('Event deleted')
    await fetchEvents()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(msg || 'Failed to delete event')
  }
}

onMounted(async () => {
  await checkAdmin()
  if (isAdmin.value) await fetchEvents()
})

const formatDate = (d?: string | null) => {
  if (!d) return ''
  try {
    return format(new Date(d), 'MMM d, yyyy')
  } catch (err: unknown) {
    console.warn(err)
    return d
  }
}

const badgeClass = (published?: boolean) => {
  return published
    ? 'inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-sm'
    : 'inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-sm'
}
</script>

<!-- Styles are handled globally via Tailwind -->
