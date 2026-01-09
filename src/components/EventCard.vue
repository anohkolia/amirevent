<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { format } from 'date-fns'

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

const lowestPrice = computed<number | null>(() => {
  const t = ticketTypes
  if (!t || t.length === 0) return null
  return Math.min(...t.map((x) => Number(x.price || 0)))
})

const hasAvailability = computed(() => {
  const t = ticketTypes
  if (!t) return true
  return t.some((x) => Number(x.capacity || 0) - Number(x.sold || 0) > 0)
})

const formattedDate = computed(() => {
  const d = event.date
  if (!d) return ''
  return format(new Date(d), 'EEEE, MMMM d, yyyy')
})
</script>

<template>
  <RouterLink :to="`/event/${event.id}`" class="group block">
    <div
      class="overflow-hidden border-border/50 bg-card rounded-lg hover:border-primary/50 transition-all duration-300"
    >
      <div class="aspect-video relative overflow-hidden">
        <template v-if="event.image_url">
          <img
            :src="event.image_url"
            :alt="event.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </template>
        <template v-else>
          <div
            class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center"
          >
            <span class="text-primary/50 text-3xl">📅</span>
          </div>
        </template>

        <div
          v-if="lowestPrice !== null"
          class="absolute top-3 right-3 bg-primary text-primary-foreground font-semibold px-3 py-1 rounded"
        >
          {{ lowestPrice === 0 ? 'Free' : `From €${lowestPrice.toFixed(2)}` }}
        </div>

        <div
          v-if="!hasAvailability && ticketTypes && ticketTypes.length > 0"
          class="absolute top-3 left-3 bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs"
        >
          Sold Out
        </div>
      </div>

      <div class="p-5">
        <h3
          class="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2"
        >
          {{ event.name }}
        </h3>
        <div class="space-y-2 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <span class="text-primary">📅</span>
            <span>{{ formattedDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-primary">⏰</span>
            <span>{{ (event.time || '').slice(0, 5) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-primary">📍</span>
            <span class="line-clamp-1">{{ event.location }}</span>
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.text-muted-foreground {
  color: var(--muted-foreground);
}

.text-primary {
  color: hsl(var(--primary));
}
</style>
