import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/integrations/supabase/client'

export interface Event {
  id: string
  name: string
  description?: string | null
  date: string
  time?: string | null
  location?: string | null
  image_url?: string | null
  is_published?: boolean
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  price: number
  capacity: number
  sold: number
}

export const useEventsStore = defineStore('events', () => {
  const events = ref<Event[]>([])
  const ticketTypes = ref<Record<string, TicketType[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination / infinite loading state
  const page = ref(0)
  const pageSize = ref(9)
  const hasMore = ref(true)

  async function fetchEvents(opts?: { page?: number; pageSize?: number; append?: boolean }) {
    loading.value = true
    error.value = null

    const requestedPage = opts?.page ?? 1
    const requestedPageSize = opts?.pageSize ?? pageSize.value
    const append = opts?.append ?? false

    try {
      const start = (requestedPage - 1) * requestedPageSize
      const end = requestedPage * requestedPageSize - 1

      // Request with exact count to determine hasMore if supported
      const { data: eventsData, error: eventsErr, count } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('is_published', true)
        .order('date', { ascending: true })
        .range(start, end)

      if (eventsErr) throw eventsErr

      const fetched = (eventsData as Event[]) || []

      if (append) {
        events.value = [...events.value, ...fetched]
      } else {
        events.value = fetched
      }

      // Update pagination state
      page.value = requestedPage
      // If count is provided, use it; otherwise infer from fetched length
      if (typeof count === 'number') {
        hasMore.value = events.value.length < count
      } else {
        hasMore.value = fetched.length === requestedPageSize
      }

      // Fetch ticket types only for newly loaded events
      if (events.value.length > 0) {
        const eventIds = (append ? fetched : events.value).map((e) => e.id)
        if (eventIds.length > 0) {
          const { data: ticketsData, error: ticketsErr } = await supabase
            .from('ticket_types')
            .select('*')
            .in('event_id', eventIds)

          if (ticketsErr) throw ticketsErr

          // Merge ticket types into existing map (preserve previously fetched)
          const grouped: Record<string, TicketType[]> = { ...(ticketTypes.value || {}) }
          for (const ticket of (ticketsData as TicketType[]) || []) {
            const eventId = ticket.event_id
            if (!grouped[eventId]) grouped[eventId] = []
            grouped[eventId].push(ticket)
          }
          ticketTypes.value = grouped
        }
      }
    } catch (e) {
      error.value = 'Failed to fetch events'
      console.error(e)
      if (!append) events.value = []
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  function resetEvents() {
    events.value = []
    ticketTypes.value = {}
    page.value = 0
    hasMore.value = true
    error.value = null
  }

  async function fetchEventById(id: string): Promise<Event | null> {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.from('events').select('*').eq('id', id).single()

      if (err) throw err
      return data as Event
    } catch (e) {
      error.value = 'Failed to fetch event'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchTicketTypes(eventId: string): Promise<TicketType[]> {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true })

      if (err) throw err
      const types = (data as TicketType[]) || []
      ticketTypes.value[eventId] = types
      return types
    } catch (e) {
      error.value = 'Failed to fetch ticket types'
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    ticketTypes,
    loading,
    error,
    page,
    pageSize,
    hasMore,
    fetchEvents,
    resetEvents,
    fetchEventById,
    fetchTicketTypes,
  }
})
