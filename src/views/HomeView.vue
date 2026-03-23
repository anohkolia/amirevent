<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendarDays, faStar } from '@fortawesome/free-solid-svg-icons'
import { useEventsStore } from '@/stores/events'
import SearchBar from '@/components/SearchBar.vue'
import EventCard from '@/components/EventCard.vue'

const eventsStore = useEventsStore()
const searchQuery = ref('')

const filteredEvents = computed(() => {
  const events = eventsStore.events
  if (!events.length) return []

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return events

  return events.filter(
    (event) =>
      event.name.toLowerCase().includes(query) ||
      (event.location?.toLowerCase().includes(query) ?? false),
  )
})

const hasSearchQuery = computed(() => searchQuery.value.trim().length > 0)
const eventsCountLabel = computed(() =>
  filteredEvents.value.length <= 1 ? 'événement disponible' : 'événements disponibles',
)

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

async function loadFirstPage() {
  eventsStore.resetEvents()
  await eventsStore.fetchEvents({ page: 1, pageSize: eventsStore.pageSize, append: false })
}

async function loadNextPage() {
  if (eventsStore.loading || !eventsStore.hasMore || hasSearchQuery.value) return
  const next = (eventsStore.page ?? 0) + 1
  await eventsStore.fetchEvents({ page: next, pageSize: eventsStore.pageSize, append: true })
}

onMounted(() => {
  loadFirstPage()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadNextPage()
      }
    },
    { root: null, rootMargin: '220px', threshold: 0.1 },
  )

  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

watch(sentinel, (newEl, oldEl) => {
  if (!observer) return
  if (oldEl) observer.unobserve(oldEl)
  if (newEl) observer.observe(newEl)
})

watch(hasSearchQuery, (active) => {
  if (!active && eventsStore.events.length === 0) {
    loadFirstPage()
  }
})
</script>

<template>
  <div class="min-h-screen">
    <section class="relative overflow-hidden py-16 md:py-24">
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent" />
      <div class="pointer-events-none absolute -left-24 top-10 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
      <div class="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

      <div class="app-container relative">
        <div class="mx-auto max-w-3xl text-center">
          <div class="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/12 px-4 py-2 text-primary">
            <FontAwesomeIcon :icon="faStar" class="h-4 w-4" aria-hidden="true" />
            <span class="text-sm font-semibold">La billetterie de vos événements majeurs</span>
          </div>

          <h1 class="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Réservez votre prochaine <span class="text-gradient">expérience</span> en quelques secondes
          </h1>

          <p class="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Explorez les événements à venir, comparez les tarifs et finalisez vos billets avec un parcours simple et
            fiable.
          </p>

          <div class="mx-auto mt-8 max-w-xl">
            <SearchBar v-model="searchQuery" />
          </div>
        </div>
      </div>
    </section>

    <section class="pb-16 md:pb-20">
      <div class="app-container">
        <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div class="mb-2 inline-flex items-center gap-2 text-primary">
              <FontAwesomeIcon :icon="faCalendarDays" class="h-5 w-5" aria-hidden="true" />
              <span class="text-sm font-semibold uppercase tracking-wide">Programmation</span>
            </div>
            <h2 class="font-display text-2xl font-semibold text-foreground md:text-3xl">Événements à venir</h2>
          </div>
          <p class="rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground">
            {{ filteredEvents.length }} {{ eventsCountLabel }}
          </p>
        </div>

        <div
          v-if="eventsStore.loading && eventsStore.events.length === 0"
          class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          <div v-for="i in 6" :key="i" class="panel animate-pulse p-4">
            <div class="aspect-video rounded-lg bg-muted/70" />
            <div class="mt-4 h-6 w-2/3 rounded bg-muted/70" />
            <div class="mt-3 h-4 w-1/2 rounded bg-muted/70" />
          </div>
        </div>

        <div v-else-if="filteredEvents.length === 0" class="panel py-14 text-center">
          <FontAwesomeIcon :icon="faCalendarDays" class="mx-auto h-14 w-14 text-muted-foreground" aria-hidden="true" />
          <h3 class="mt-4 font-display text-xl font-semibold text-foreground">
            {{ hasSearchQuery ? 'Aucun événement trouvé' : 'Aucun événement publié pour le moment' }}
          </h3>
          <p class="mt-2 text-muted-foreground">
            {{
              hasSearchQuery
                ? 'Essayez une recherche plus large ou un autre mot-clé.'
                : 'Revenez bientôt, de nouveaux événements sont en préparation.'
            }}
          </p>
        </div>

        <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <EventCard
            v-for="event in filteredEvents"
            :key="String(event.id)"
            :event="{ ...event, id: String(event.id) }"
            :ticket-types="eventsStore.ticketTypes[event.id] || []"
          />
        </div>

        <div class="mt-8 flex items-center justify-center">
          <p v-if="eventsStore.loading && eventsStore.events.length > 0" class="text-sm text-muted-foreground">
            Chargement des prochains événements...
          </p>
        </div>

        <div ref="sentinel" class="h-8" aria-hidden="true" />
      </div>
    </section>
  </div>
</template>
