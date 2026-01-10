<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventsStore } from '@/stores/events'
import HeaderView from '@/components/HeaderView.vue'
import SearchBar from '@/components/SearchBar.vue'
import EventCard from '@/components/EventCard.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendar, faStar } from '@fortawesome/free-solid-svg-icons'

const eventsStore = useEventsStore()
const searchQuery = ref('')

const filteredEvents = computed(() => {
  const events = eventsStore.events
  if (!events || events.length === 0) {
    return []
  }
  if (!searchQuery.value) {
    return events
  }
  const query = searchQuery.value.toLowerCase()
  return events.filter(
    (event) =>
      event.name.toLowerCase().includes(query) ||
      (event.location?.toLowerCase().includes(query) ?? false),
  )
})

onMounted(() => {
  eventsStore.fetchEvents()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <HeaderView />

    <!-- Hero Section -->
    <section class="relative py-16 md:py-24 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div class="container relative">
        <div class="max-w-3xl mx-auto text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <FontAwesomeIcon :icon="faStar" class="h-4 w-4" />
            <span class="text-sm font-medium">Discover Amazing Events</span>
          </div>
          <h1 class="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            Find Your Next <span class="text-gradient">Experience</span>
          </h1>
          <p class="text-lg text-muted-foreground mb-8">
            Browse upcoming events and secure your tickets in seconds. Simple, fast, and secure.
          </p>
          <div class="max-w-md mx-auto">
            <SearchBar v-model="searchQuery" />
          </div>
        </div>
      </div>
    </section>

    <!-- Events Section -->
    <section class="py-12 md:py-16">
      <div class="container">
        <div class="flex items-center gap-3 mb-8">
          <FontAwesomeIcon :icon="faCalendar" class="h-6 w-6 text-primary" />
          <h2 class="font-display text-2xl font-semibold text-foreground">Upcoming Events</h2>
          <span v-if="eventsStore.events.length > 0" class="text-muted-foreground">
            ({{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'event' : 'events' }})
          </span>
        </div>

        <div v-if="eventsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="space-y-4 animate-pulse">
            <div class="aspect-video rounded-lg bg-muted" />
            <div class="h-6 w-3/4 rounded bg-muted" />
            <div class="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>

        <div v-else-if="filteredEvents.length === 0" class="text-center py-16">
          <FontAwesomeIcon :icon="faCalendar" class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 class="font-display text-xl font-semibold text-foreground mb-2">
            {{ searchQuery ? 'No events found' : 'No events available' }}
          </h3>
          <p class="text-muted-foreground">
            {{
              searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back soon for upcoming events!'
            }}
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCard v-for="event in filteredEvents" :key="String(event.id)" :event="{ ...event, id: String(event.id) }"
            :ticket-types="eventsStore.ticketTypes[event.id] || []" />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border py-8">
      <div class="container text-center text-muted-foreground text-sm">
        <p>&copy; {{ new Date().getFullYear() }} EventTix. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
