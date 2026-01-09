import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Event {
  id: number
  name: string
  description: string
  date: string
  location: string
  imageUrl: string
  price: number
  category?: string
}

export interface TicketType {
  id: number
  eventId: number
  name: string
  description: string
  price: number
  available: number
  sold: number
}

export const useEventsStore = defineStore('events', () => {
  const events = ref<Event[]>([])
  const ticketTypes = ref<TicketType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Mock data for demo purposes
  const mockEvents: Event[] = [
    {
      id: 1,
      name: 'Summer Music Festival',
      description:
        'The biggest music festival of the summer featuring top artists from around the world.',
      date: '2025-07-15T18:00:00Z',
      location: 'Central Park, New York',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=450&fit=crop',
      price: 99,
      category: 'Music',
    },
    {
      id: 2,
      name: 'Tech Conference 2025',
      description:
        'Join industry leaders for insights into the future of technology and innovation.',
      date: '2025-08-20T09:00:00Z',
      location: 'Convention Center, San Francisco',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
      price: 299,
      category: 'Technology',
    },
    {
      id: 3,
      name: 'Comedy Night Live',
      description: 'An evening of laughter with the best comedians in the business.',
      date: '2025-06-10T20:00:00Z',
      location: 'The Comedy Club, Los Angeles',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=450&fit=crop',
      price: 49,
      category: 'Entertainment',
    },
    {
      id: 4,
      name: 'Art Exhibition Opening',
      description: 'Exclusive preview of contemporary art from emerging artists worldwide.',
      date: '2025-07-01T17:00:00Z',
      location: 'Modern Art Museum, Chicago',
      imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&h=450&fit=crop',
      price: 35,
      category: 'Art',
    },
    {
      id: 5,
      name: 'Food & Wine Festival',
      description: 'Sample culinary delights and fine wines from renowned chefs and wineries.',
      date: '2025-09-05T11:00:00Z',
      location: 'Riverside Festival Grounds, Napa Valley',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=450&fit=crop',
      price: 150,
      category: 'Food & Drink',
    },
    {
      id: 6,
      name: 'Marathon 2025',
      description: 'Annual city marathon open to runners of all skill levels.',
      date: '2025-10-12T07:00:00Z',
      location: 'Downtown, Boston',
      imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&h=450&fit=crop',
      price: 75,
      category: 'Sports',
    },
  ]

  const mockTicketTypes: Record<number, TicketType[]> = {
    1: [
      {
        id: 1,
        eventId: 1,
        name: 'General Admission',
        description: 'Access to all general areas',
        price: 99,
        available: 1000,
        sold: 450,
      },
      {
        id: 2,
        eventId: 1,
        name: 'VIP Pass',
        description: 'VIP area access, meet & greet',
        price: 299,
        available: 100,
        sold: 45,
      },
    ],
    2: [
      {
        id: 3,
        eventId: 2,
        name: 'Standard',
        description: 'Conference access',
        price: 299,
        available: 500,
        sold: 200,
      },
      {
        id: 4,
        eventId: 2,
        name: 'Premium',
        description: 'Conference + workshops',
        price: 499,
        available: 100,
        sold: 30,
      },
    ],
  }

  async function fetchEvents() {
    loading.value = true
    error.value = null
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      events.value = mockEvents
    } catch (e) {
      error.value = 'Failed to fetch events'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchEventById(id: number): Promise<Event | null> {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const event = events.value.find((e) => e.id === id)
      if (!event) {
        // Load from mock if not in store
        const found = mockEvents.find((e) => e.id === id)
        if (found) {
          events.value.push(found)
          return found
        }
        return null
      }
      return event
    } catch (e) {
      error.value = 'Failed to fetch event'
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchTicketTypes(eventId: number): Promise<TicketType[]> {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const types = mockTicketTypes[eventId] || []
      ticketTypes.value = types
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
