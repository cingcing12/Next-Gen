<script setup>
import { ref, onMounted, computed } from 'vue'
import { ArrowRight, Star } from 'lucide-vue-next'
import { useProductStore } from '../stores/product'
import { useSystemStore } from '../stores/system'
import ProductCard from '../components/ProductCard.vue'
import ProductSkeletonCard from '../components/ProductSkeletonCard.vue'
import ProductQuickViewModal from '../components/ProductQuickViewModal.vue'

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

const swiperModules = [Autoplay, Pagination, EffectFade]

const productStore = useProductStore()
const systemStore = useSystemStore()

const quickViewProduct = ref(null)
const isQuickViewOpen = ref(false)

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
})

const featuredProducts = computed(() => {
  const count = systemStore.config?.featuredProductCount || 4
  return [...productStore.products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count)
})
</script>

<template>
  <div>
    <!-- Hero Swiper Skeleton -->
    <div v-if="!systemStore.config?.homeSlider?.length" class="relative h-[500px] sm:h-[650px] w-full bg-slate-900 flex flex-col justify-center overflow-hidden">
      <!-- Animated Background Glows -->
      <div class="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-slate-500/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 1s;"></div>
      
      <!-- Skeleton Content Container -->
      <div class="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center w-full z-10">
        <div class="max-w-xl w-full space-y-6">
          <!-- Title Skeleton -->
          <div class="space-y-3">
            <div class="h-10 sm:h-16 w-3/4 bg-slate-800/80 rounded-2xl animate-pulse"></div>
            <div class="h-10 sm:h-16 w-1/2 bg-indigo-900/40 rounded-2xl animate-pulse"></div>
          </div>
          
          <!-- Description Skeleton -->
          <div class="space-y-2.5 pt-2">
            <div class="h-4 sm:h-5 w-full max-w-sm sm:max-w-none bg-slate-800/60 rounded-lg animate-pulse" style="animation-delay: 0.1s;"></div>
            <div class="h-4 sm:h-5 w-5/6 max-w-sm sm:max-w-none bg-slate-800/60 rounded-lg animate-pulse" style="animation-delay: 0.2s;"></div>
          </div>
          
          <!-- Button Skeleton -->
          <div class="pt-4">
            <div class="h-11 sm:h-14 w-40 sm:w-48 bg-indigo-600/30 rounded-xl sm:rounded-2xl animate-pulse" style="animation-delay: 0.3s;"></div>
          </div>
        </div>
      </div>
      
      <!-- Skeleton Pagination Dots -->
      <div class="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 z-10">
        <div class="w-8 h-2.5 rounded-full bg-indigo-500/50 animate-pulse"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" style="animation-delay: 0.2s;"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-slate-700 animate-pulse" style="animation-delay: 0.4s;"></div>
      </div>
    </div>

    <!-- Hero Swiper Slider -->
    <swiper
      v-else
      :modules="swiperModules"
      effect="fade"
      :autoplay="{ delay: 5000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :loop="true"
      class="relative h-[500px] sm:h-[650px] w-full bg-slate-900 home-hero-swiper"
    >
      <swiper-slide 
        v-for="(slide, index) in (systemStore.config?.homeSlider || [])" 
        :key="index"
      >
        <!-- Background Image with Zoom Effect -->
        <div class="absolute inset-0 w-full h-full overflow-hidden">
          <img 
            :src="slide.image" 
            class="w-full h-full object-cover object-center slide-bg-image" 
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <!-- Content -->
        <div class="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pointer-events-none">
          <div class="max-w-xl text-white pointer-events-auto slide-content">
            <h1 class="text-3xl sm:text-6xl font-extrabold tracking-tight mb-3 sm:mb-4">
              {{ slide.title }} <br/>
              <span class="text-indigo-400">{{ slide.highlight }}</span>
            </h1>
            <p class="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 leading-relaxed max-w-sm sm:max-w-none">
              {{ slide.description }}
            </p>
            <div class="flex space-x-4">
              <router-link to="/shop" class="px-6 py-2.5 sm:px-8 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center group">
                Shop Collection
                <ArrowRight class="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
              </router-link>
            </div>
          </div>
        </div>
      </swiper-slide>
    </swiper>

    <!-- Featured Products -->
    <section class="py-10 sm:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-end mb-6 sm:mb-12">
          <div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Featured Styles</h2>
            <p class="mt-1 sm:mt-2 text-xs sm:text-base text-slate-500">The most loved pieces this season.</p>
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
    <section class="py-10 sm:py-20 bg-slate-50 border-t border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-indigo-600 rounded-3xl overflow-hidden shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row">
          <div class="md:w-1/2 p-6 sm:p-10 md:p-16 flex flex-col justify-center">
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">{{ systemStore.config?.aboutShop?.title || 'About Our Shop' }}</h2>
            <p class="text-indigo-100 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
              {{ systemStore.config?.aboutShop?.description || 'Next-Gen was born out of a desire to create clothing that looks good and feels incredible. We use sustainable materials and ethical manufacturing to bring you the best in modern fashion.' }}
            </p>
            <router-link to="/about" class="inline-flex self-start items-center text-white text-sm sm:text-base font-semibold border-b border-white/30 hover:border-white transition-colors pb-1 group">
              Read Our Story
              <ArrowRight class="w-4 h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
          <div class="md:w-1/2 min-h-[250px] sm:min-h-[300px] relative">
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

<style>
/* Swiper Custom Pagination */
.home-hero-swiper .swiper-pagination {
  bottom: 30px !important;
}
.home-hero-swiper .swiper-pagination-bullet {
  background-color: rgba(255, 255, 255, 0.5);
  opacity: 1;
  width: 10px;
  height: 10px;
  transition: all 0.3s ease;
}
.home-hero-swiper .swiper-pagination-bullet-active {
  background-color: #6366f1; /* indigo-500 */
  width: 32px;
  border-radius: 5px;
}

/* Animations for Active Slide */
.home-hero-swiper .swiper-slide .slide-bg-image {
  transform: scale(1);
  transition: transform 10s ease-out;
}
.home-hero-swiper .swiper-slide-active .slide-bg-image {
  transform: scale(1.05);
}

.home-hero-swiper .swiper-slide .slide-content {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s ease-out;
  transition-delay: 0.3s;
}
.home-hero-swiper .swiper-slide-active .slide-content {
  opacity: 1;
  transform: translateY(0);
}
</style>
