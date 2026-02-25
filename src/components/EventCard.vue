<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCalendarDays, faClock, faLocationDot } from '@fortawesome/free-solid-svg-icons'

interface TicketType {
  id?: string
  name?: string
  price?: number | string
  capacity?: number
  sold?: number
}

interface EventType {
  id: string
  name: string
  date?: string | null
  time?: string | null
  location?: string | null
  image_url?: string | null
}

const { event, ticketTypes } = defineProps<{ event: EventType; ticketTypes?: TicketType[] }>()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

const lowestPrice = computed<number | null>(() => {
  const types = ticketTypes ?? []
  if (!types.length) return null
  return Math.min(...types.map((ticket) => Number(ticket.price || 0)))
})

const hasAvailability = computed(() => {
  const types = ticketTypes ?? []
  if (!types.length) return true
  return types.some((ticket) => Number(ticket.capacity || 0) - Number(ticket.sold || 0) > 0)
})

const formattedDate = computed(() => {
  if (!event.date) return ''
  return format(new Date(event.date), 'EEEE d MMMM yyyy', { locale: fr })
})

const formattedTime = computed(() => (event.time || '').slice(0, 5))

const priceLabel = computed(() => {
  if (lowestPrice.value === null) return 'Tarif à venir'
  if (lowestPrice.value === 0) return 'Gratuit'
  return `À partir de ${formatCurrency(lowestPrice.value)}`
})
</script>

<template>
  <RouterLink :to="`/event/${event.id}`" class="group block h-full" :aria-label="`Voir l'événement ${event.name}`">
    <article
      class="panel flex h-full flex-col overflow-hidden border-border/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/55"
    >
      <div class="relative aspect-video overflow-hidden">
        <img
          v-if="event.image_url"
          :src="event.image_url"
          :alt="event.name"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-cyan-400/20">
          <FontAwesomeIcon :icon="faCalendarDays" class="h-12 w-12 text-primary/60" aria-hidden="true" />
        </div>

        <div class="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
          {{ priceLabel }}
        </div>

        <div
          v-if="!hasAvailability && ticketTypes && ticketTypes.length > 0"
          class="absolute left-3 top-3 rounded-full border border-red-300/80 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
        >
          Épuisé
        </div>
      </div>

      <div class="flex flex-1 flex-col p-5">
        <h3 class="line-clamp-2 font-display text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
          {{ event.name }}
        </h3>

        <div class="mt-4 space-y-2 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <FontAwesomeIcon :icon="faCalendarDays" class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span class="capitalize">{{ formattedDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <FontAwesomeIcon :icon="faClock" class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{{ formattedTime || 'Horaire communiqué prochainement' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <FontAwesomeIcon :icon="faLocationDot" class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span class="line-clamp-1">{{ event.location || 'Lieu à confirmer' }}</span>
          </div>
        </div>
      </div>
    </article>
  </RouterLink>
</template>
