<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useEventsStore, type Event, type TicketType } from '@/stores/events'
import TicketSelector from '@/components/TicketSelector.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendar, faMapPin, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

const route = useRoute()
const router = useRouter()
const eventsStore = useEventsStore()

const event = ref<Event | null>(null)
const ticketTypes = ref<TicketType[]>([])
const loading = ref(true)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-EU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (timeString: string | null | undefined) => {
  if (!timeString) return ''
  return timeString.slice(0, 5)
}

const isLoading = computed(() => loading.value || eventsStore.loading)

onMounted(async () => {
  const eventId = route.params.id as string

  if (!eventId) {
    router.push('/')
    return
  }

  loading.value = true

  try {
    const fetchedEvent = await eventsStore.fetchEventById(eventId)

    // Evenement non trouvé, rediriger vers la page d'accueil
    if (!fetchedEvent) {
      router.push('/')
      return
    }

    event.value = fetchedEvent
    ticketTypes.value = await eventsStore.fetchTicketTypes(eventId)
  } catch (error) {
    console.error('Échec du chargement de l\'événement:', error)
    router.push('/')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">

    <!-- Chargement  -->
    <div v-if="isLoading" class="container py-8">
      <div class="h-8 w-32 mb-6 bg-muted rounded animate-pulse"></div>
      <div class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="aspect-video rounded-lg bg-muted animate-pulse"></div>
          <div class="h-10 w-3/4 bg-muted rounded animate-pulse"></div>
          <div class="h-24 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div>
          <div class="h-96 w-full rounded-lg bg-muted animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Evenement non trouvé -->
    <div v-else-if="!event" class="container py-16 text-center">
      <h1 class="font-display text-2xl font-semibold text-foreground mb-4">Evénement non trouvé</h1>
      <p class="text-muted-foreground mb-6">
        L'événement que vous recherchez n'existe pas ou a été supprimé.
      </p>
      <RouterLink to="/">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium">
          Retour aux événements
        </button>
      </RouterLink>
    </div>

    <!-- Event Details -->
    <div v-else class="container py-8">
      <RouterLink to="/"
        class="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
        <FontAwesomeIcon :icon="faArrowLeft" class="h-4 w-4" />
        <span>Retour aux événements</span>
      </RouterLink>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Event Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Event Image -->
          <div v-if="event.image_url" class="aspect-video rounded-lg overflow-hidden">
            <img :src="event.image_url" :alt="event.name" class="w-full h-full object-cover" />
          </div>
          <div v-else
            class="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
            <FontAwesomeIcon :icon="faCalendar" class="h-20 w-20 text-primary/50" />
          </div>

          <div>
            <h1 class="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {{ event.name }}
            </h1>

            <div class="flex flex-wrap gap-6 mb-6">
              <div class="flex items-center gap-2 text-muted-foreground">
                <FontAwesomeIcon :icon="faCalendar" class="h-5 w-5 text-primary" />
                <span>{{ formatDate(event.date) }}</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <FontAwesomeIcon :icon="faClock" class="h-5 w-5 text-primary" />
                <span>{{ formatTime(event.time) }}</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <FontAwesomeIcon :icon="faMapPin" class="h-5 w-5 text-primary" />
                <span>{{ event.location }}</span>
              </div>
            </div>

            <div v-if="event.description" class="prose prose-invert max-w-none">
              <p class="text-muted-foreground whitespace-pre-wrap">
                {{ event.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Ticket Selection -->
        <div class="lg:sticky lg:top-24 h-fit">
          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="font-display text-lg font-semibold text-foreground mb-4">Obtenez des billets</h3>
            <TicketSelector v-if="ticketTypes.length > 0" :event="event" />
            <p v-else class="text-muted-foreground text-center py-8">
              Aucun billet disponible pour cet événement.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
