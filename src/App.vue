<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <HeaderView />
    <main class="flex-1">
      <RouterView />
    </main>
    <FooterView />
  </div>
</template>
