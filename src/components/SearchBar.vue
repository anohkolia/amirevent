<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

const { modelValue, placeholder } = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const update = (v: string) => emit('update:modelValue', v)
</script>

<template>
  <div class="relative">
    <label for="events-search" class="sr-only">Rechercher un événement</label>
    <FontAwesomeIcon
      :icon="faMagnifyingGlass"
      class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <input
      id="events-search"
      type="text"
      :value="modelValue"
      @input="update(($event.target as HTMLInputElement).value)"
      :placeholder="placeholder || 'Rechercher des événements...'"
      autocomplete="off"
      spellcheck="false"
      class="input-base pl-10"
    />
  </div>
</template>
