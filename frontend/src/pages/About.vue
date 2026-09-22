<script setup>
import { onMounted } from 'vue'
import * as icons from 'lucide-vue-next'
import { useSystemStore } from '../stores/system'

const systemStore = useSystemStore()

onMounted(async () => {
  if (!systemStore.config) {
    await systemStore.fetchConfig()
  }
})
</script>

<template>
  <div class="bg-white">
    <!-- Hero Section -->
    <div class="relative bg-slate-900 py-16 sm:py-32 overflow-hidden">
      <div class="absolute inset-0">
        <img :src="systemStore.config?.aboutPage?.heroImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000'" alt="About Shop" class="w-full h-full object-cover opacity-30" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">{{ systemStore.config?.aboutPage?.heroTitle || 'About Next-Gen' }}</h1>
        <p class="mt-4 sm:mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto">
          {{ systemStore.config?.aboutPage?.heroDescription || 'We believe that style is a way to say who you are without having to speak. Our mission is to provide premium, accessible fashion for both men and women, tailored for perfection.' }}
        </p>
      </div>
    </div>

    <!-- Our Values -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      <div class="text-center mb-8 sm:mb-16">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ systemStore.config?.aboutPage?.valuesTitle || 'Why Shop With Us?' }}</h2>
        <p class="mt-2 sm:mt-4 text-xs sm:text-base text-slate-500 max-w-2xl mx-auto">{{ systemStore.config?.aboutPage?.valuesDescription || 'We are dedicated to providing the best shopping experience possible, focusing on quality, sustainability, and outstanding customer service.' }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10">
        <div v-for="(value, index) in (systemStore.config?.aboutPage?.values || [])" :key="index" class="text-center p-5 sm:p-6 bg-slate-50 rounded-2xl">
          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <component :is="icons[value.icon] || icons.Star" class="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">{{ value.title }}</h3>
          <p class="text-slate-500 text-xs sm:text-sm">{{ value.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
