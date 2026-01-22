<script setup lang="ts">
const { modelValue, placeholder } = defineProps<{ modelValue: string; placeholder?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const update = (v: string) => emit('update:modelValue', v)
</script>

<template>
  <div class="relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
    <input
      type="text"
      :value="modelValue"
      @input="update(($event.target as HTMLInputElement).value)"
      :placeholder="placeholder || 'Rechercher des événements...'"
      class="pl-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded"
    />
  </div>
</template>

<style scoped>
.text-muted-foreground {
  color: var(--muted-foreground);
}
</style>
