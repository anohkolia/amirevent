<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEventsStore } from '@/stores/events'
import SearchBar from '@/components/SearchBar.vue'
import EventCard from '@/components/EventCard.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendar, faStar } from '@fortawesome/free-solid-svg-icons'

// Store Pinia pour gérer les événements (état, actions, pagination)
const eventsStore = useEventsStore()

// Variable réactive pour la barre de recherche, Contient le texte saisi par l'utilisateur
const searchQuery = ref('')

/**
 * Propriété calculée qui filtre les événements selon la recherche
 *
 * Logique de filtrage :
 * . Si aucun événement n'est chargé → retourne un tableau vide
 * . Si la recherche est vide → retourne tous les événements
 * . Si une recherche est active → filtre par nom ou lieu (insensible à la casse)
 */
const filteredEvents = computed(() => {
  // Récupère les événements depuis le store
  const events = eventsStore.events
  // Vérifie si des événements existent
  if (!events || events.length === 0) {
    return []
  }
  // Si pas de recherche, retourne tous les événements
  if (!searchQuery.value) {
    return events
  }
  // Convertit la recherche en minuscules pour comparaison insensible à la casse
  const query = searchQuery.value.toLowerCase()
  // Filtre les événements où le nom OU le lieu contient la requête
  return events.filter(
    (event) =>
      // Vérifie si le nom de l'événement contient la recherche
      event.name.toLowerCase().includes(query) ||
      // Vérifie si le lieu contient la recherche (optionnel avec ??)
      (event.location?.toLowerCase().includes(query) ?? false),
  )
})


// Chargement infini
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

async function loadFirstPage() {
  eventsStore.resetEvents()
  await eventsStore.fetchEvents({ page: 1, pageSize: eventsStore.pageSize, append: false })
}

async function loadNextPage() {
  if (eventsStore.loading || !eventsStore.hasMore) return
  const next = (eventsStore.page ?? 0) + 1
  await eventsStore.fetchEvents({ page: next, pageSize: eventsStore.pageSize, append: true })
}

onMounted(() => {
  // Charge la première page au montage
  loadFirstPage()

  // Configure l'observer pour le défilement infini
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Si une recherche est en cours, ne pas charger plus d'événements
          if (searchQuery.value) return
          loadNextPage()
        }
      }
    },
    { root: null, rootMargin: '200px', threshold: 0.1 },
  )

  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value)
    observer.disconnect()
  }
})

// Si le sentinel change (re-render), ré-observer le nouvel élément
watch(sentinel, (el) => {
  if (observer && el) observer.observe(el)
})

// Optionel: quand la requête de recherche change, réinitialiser les événements si la recherche est vide
watch(
  () => searchQuery.value,
  (val, old) => {
    // Si la recherche est vidée, recharger les événements
    if (!val) {
      if (eventsStore.events.length === 0) loadFirstPage()
    }
  },
)
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- Hero Section -->
    <section class="relative py-16 md:py-24 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div class="container relative">
        <div class="max-w-3xl mx-auto text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <FontAwesomeIcon :icon="faStar" class="h-4 w-4" />
            <span class="text-sm font-medium">Découvrez des événements incroyables</span>
          </div>
          <h1 class="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            Trouvez votre prochaine <span class="text-gradient">Expérience</span>
          </h1>
          <p class="text-lg text-muted-foreground mb-8">
            Parcourez les événements à venir et réservez vos billets en quelques secondes. Simple, rapide et sécurisé.
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
          <h2 class="font-display text-2xl font-semibold text-foreground">Événements à venir</h2>
          <span v-if="eventsStore.events.length > 0" class="text-muted-foreground">
            ({{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'événement' : 'événements' }})
          </span>
        </div>

        <div v-if="eventsStore.loading && eventsStore.events.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="space-y-4 animate-pulse">
            <div class="aspect-video rounded-lg bg-muted" />
            <div class="h-6 w-3/4 rounded bg-muted" />
            <div class="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>

        <div v-else-if="filteredEvents.length === 0" class="text-center py-16">
          <FontAwesomeIcon :icon="faCalendar" class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 class="font-display text-xl font-semibold text-foreground mb-2">
            {{ searchQuery ? 'Aucun événement trouvé' : 'Aucun événement disponible' }}
          </h3>
          <p class="text-muted-foreground">
            {{
              searchQuery
                ? 'Essayez d\'ajuster vos critères de recherche'
                : 'Revenez bientôt pour découvrir les prochains événements !'
            }}
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EventCard
            v-for="event in filteredEvents"
            :key="String(event.id)"
            :event="{ ...event, id: String(event.id) }"
            :ticket-types="eventsStore.ticketTypes[event.id] || []"
          />
        </div>

        <!-- Chargement / sentinel pour le défilement infini -->
        <div class="flex items-center justify-center mt-8">
          <div v-if="eventsStore.loading && eventsStore.events.length > 0" class="loader">Chargement...</div>
        </div>

        <div ref="sentinel" class="h-6" aria-hidden="true"></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* style de chargeur minimal */
.loader {
  padding: 0.5rem 1rem;
  color: var(--muted-foreground);
}
</style>
