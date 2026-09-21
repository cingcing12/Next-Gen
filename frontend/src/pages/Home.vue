<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ArrowRight, Star } from 'lucide-vue-next'
import { useProductStore } from '../stores/product'
import { useSystemStore } from '../stores/system'
import ProductCard from '../components/ProductCard.vue'
import ProductSkeletonCard from '../components/ProductSkeletonCard.vue'
import ProductQuickViewModal from '../components/ProductQuickViewModal.vue'

const productStore = useProductStore()
const systemStore = useSystemStore()

const quickViewProduct = ref(null)
const isQuickViewOpen = ref(false)

const currentSlide = ref(0)
let sliderInterval = null

const handleQuickView = (product) => {
  quickViewProduct.value = product
  isQuickViewOpen.value = true
}

const closeQuickView = () => {
  isQuickViewOpen.value = false
  quickViewProduct.value = null
}

onMounted(async () => {
  productStore.fetchProducts()
  await systemStore.fetchConfig()
  
  sliderInterval = setInterval(() => {
    if (systemStore.config?.homeSlider?.length > 0) {
      currentSlide.value = (currentSlide.value + 1) % systemStore.config.homeSlider.length
    }
  }, 5000)
})

const featuredProducts = computed(() => {
  const count = systemStore.config?.featuredProductCount || 4
  return [...productStore.products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count)
})

onUnmounted(() => {
  if (sliderInterval) clearInterval(sliderInterval)
})
</script>

<template>
  <div>
    <!-- Hero Slider -->
    <div class="relative h-[650px] w-full overflow-hidden bg-slate-900">
      <div 
        v-for="(slide, index) in (systemStore.config?.homeSlider || [])" 
        :key="index"
        :class="[
          'absolute inset-0 transition-opacity duration-1000 ease-in-out',
          currentSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
        ]"
      >
        <!-- Background Image with Zoom Effect -->
        <img 
          :src="slide.image" 
          class="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-out" 
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        
        <!-- Content -->
        <div class="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div class="max-w-xl text-white transform transition-all duration-700 delay-300" :class="currentSlide === index ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'">
            <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
              {{ slide.title }} <br/>
              <span class="text-indigo-400">{{ slide.highlight }}</span>
            </h1>
            <p class="text-lg text-slate-300 mb-8 leading-relaxed">
              {{ slide.description }}
            </p>
            <div class="flex space-x-4">
              <router-link to="/shop" class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center group">
                Shop Collection
                <ArrowRight class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Slider Indicators -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
        <button 
          v-for="(_, index) in (systemStore.config?.homeSlider || [])" 
          :key="index"
          @click="currentSlide = index"
          :class="[
            'h-2.5 rounded-full transition-all duration-300',
            currentSlide === index ? 'w-8 bg-indigo-500' : 'w-2.5 bg-white/50 hover:bg-white'
          ]"
        ></button>
      </div>
    </div>

    <!-- Featured Products -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Featured Styles</h2>
            <p class="mt-2 text-slate-500">The most loved pieces this season.</p>
          </div>
          <router-link to="/shop" class="hidden sm:flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors group">
            View All
            <ArrowRight class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </router-link>
        </div>
        
        <!-- Grid -->
        <div v-if="productStore.loading" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          <ProductSkeletonCard v-for="i in 4" :key="i" />
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          <ProductCard
            v-for="product in featuredProducts"
            :key="product._id"
            :product="product"
            @quick-view="handleQuickView"
          />
        </div>
      </div>
    </section>
    
    <!-- About Section -->
    <section class="py-20 bg-slate-50 border-t border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-indigo-600 rounded-3xl overflow-hidden shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row">
          <div class="md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
            <h2 class="text-3xl font-bold text-white mb-4">{{ systemStore.config?.aboutShop?.title || 'About Our Shop' }}</h2>
            <p class="text-indigo-100 mb-8 leading-relaxed">
              {{ systemStore.config?.aboutShop?.description || 'Next-Gen was born out of a desire to create clothing that looks good and feels incredible. We use sustainable materials and ethical manufacturing to bring you the best in modern fashion.' }}
            </p>
            <router-link to="/about" class="inline-flex self-start items-center text-white font-semibold border-b-2 border-white/30 hover:border-white transition-colors pb-1 group">
              Read Our Story
              <ArrowRight class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
          <div class="md:w-1/2 min-h-[300px] relative">
            <img :src="systemStore.config?.aboutShop?.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=2070'" alt="About us" class="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>

    <!-- Quick View Modal -->
    <ProductQuickViewModal
      :is-open="isQuickViewOpen"
      :product="quickViewProduct"
      @close="closeQuickView"
    />
  </div>
</template>
