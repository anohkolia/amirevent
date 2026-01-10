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

  async function fetchEvents() {
    loading.value = true
    error.value = null
    try {
      // Fetch all published events
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: true })

      if (eventsErr) throw eventsErr

      events.value = (eventsData as Event[]) || []

      // Fetch ticket types for all events
      if (events.value.length > 0) {
        const eventIds = events.value.map((e) => e.id)
        const { data: ticketsData, error: ticketsErr } = await supabase
          .from('ticket_types')
          .select('*')
          .in('event_id', eventIds)

        if (ticketsErr) throw ticketsErr

        // Group ticket types by event_id
        const grouped: Record<string, TicketType[]> = {}
        for (const ticket of (ticketsData as TicketType[]) || []) {
          const eventId = ticket.event_id
          if (!grouped[eventId]) {
            grouped[eventId] = []
          }
          grouped[eventId].push(ticket)
        }
        ticketTypes.value = grouped
      }
    } catch (e) {
      error.value = 'Failed to fetch events'
      console.error(e)
      // Fallback to empty array on error
      events.value = []
    } finally {
      loading.value = false
    }
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
    fetchEvents,
    fetchEventById,
    fetchTicketTypes,
  }
})
