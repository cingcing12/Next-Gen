<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, ShoppingBag, Heart, Eye, Check } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useUIStore } from '../stores/ui'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['quick-view'])

const router = useRouter()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const ui = useUIStore()

// State for active selections directly on the card
const selectedColor = ref(
  props.product.colorVariants?.[0]?.color || props.product.colors?.[0] || ''
)
const selectedSize = ref(props.product.sizes?.[0] || '')
const isAdding = ref(false)

const currentStock = computed(() => {
  const cColor = selectedColor.value || props.product.colors?.[0]
  const cSize = selectedSize.value || props.product.sizes?.[0]

  if (cColor && props.product.colorVariants) {
    const variant = props.product.colorVariants.find(v => v.color.toLowerCase() === cColor.toLowerCase())
    if (variant) {
      if (variant.sizeVariants && cSize) {
        const sv = variant.sizeVariants.find(s => s.size === cSize)
        if (sv) return sv.stock
      }
      if (variant.stock !== undefined) return variant.stock
    }
  }
  return props.product.stock ?? 0
})

const displayColors = computed(() => {
  if (props.product.colorVariants && props.product.colorVariants.length > 0) {
    return props.product.colorVariants.map(v => v.color)
  }
  return props.product.colors || []
})

const primaryImage = computed(() => {
  // If a color is selected and has a specific image variant, show that image!
  if (selectedColor.value && props.product.colorVariants && props.product.colorVariants.length > 0) {
    const variant = props.product.colorVariants.find(
      v => v.color.toLowerCase() === selectedColor.value.toLowerCase()
    )
    if (variant) {
      if (variant.images && variant.images.length > 0) return variant.images[0]
      if (variant.image) return variant.image
    }
  }

  if (props.product.images && props.product.images.length > 0) {
    return props.product.images[0]
  }
  return props.product.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1480'
})

const secondaryImage = computed(() => {
  // If selected color has a 2nd photo, flip to that photo on hover!
  if (selectedColor.value && props.product.colorVariants && props.product.colorVariants.length > 0) {
    const variant = props.product.colorVariants.find(
      v => v.color.toLowerCase() === selectedColor.value.toLowerCase()
    )
    if (variant && variant.images && variant.images.length > 1) {
      return variant.images[1]
    }
  }

  if (props.product.images && props.product.images.length > 1) {
    return props.product.images[1]
  }
  return null
})

const isWishlisted = computed(() => {
  return wishlistStore.items.some(item => (item._id || item) === props.product._id)
})

const toggleWishlist = async (e) => {
  e.stopPropagation()
  if (isWishlisted.value) {
    await wishlistStore.removeFromWishlist(props.product._id)
    ui.toast('Removed from wishlist', 'info')
  } else {
    await wishlistStore.addToWishlist(props.product._id)
    ui.toast('Added to wishlist!', 'success')
  }
}

const openQuickView = (e) => {
  if (e) e.stopPropagation()
  emit('quick-view', props.product)
}

const navigateToDetail = () => {
  router.push(`/product/${props.product._id}`)
}

const handleQuickAddToCart = (e) => {
  e.stopPropagation()
  
  // If product has multiple sizes/colors and none selected, open quick view
  if (props.product.sizes?.length > 1 && !selectedSize.value) {
    emit('quick-view', props.product)
    return
  }
  
  if (currentStock.value <= 0) {
    ui.toast('This product is out of stock', 'error')
    return
  }

  isAdding.value = true
  const sizeToUse = selectedSize.value || props.product.sizes?.[0] || null
  const colorToUse = selectedColor.value || props.product.colors?.[0] || null

  try {
    cartStore.addToCart(props.product, 1, sizeToUse, colorToUse)
    ui.toast(`Added "${props.product.name}" to cart!`, 'success')
  } catch (err) {
    ui.toast(err.message || 'Failed to add to cart', 'error')
  }

  setTimeout(() => {
    isAdding.value = false
  }, 500)
}

const getColorStyle = (colorName) => {
  if (!colorName) return '#94a3b8'
  if (colorName.startsWith('#') || colorName.startsWith('rgb')) return colorName
  const mapping = {
    black: '#0f172a',
    white: '#f8fafc',
    gray: '#64748b',
    grey: '#64748b',
    red: '#ef4444',
    blue: '#3b82f6',
    navy: '#1e3a8a',
    green: '#10b981',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    beige: '#f5f5dc',
    brown: '#78350f'
  }
  return mapping[colorName.toLowerCase()] || colorName
}
</script>

<template>
  <div
    class="group flex flex-col relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
  >
    <!-- Card Media Container -->
    <div
      class="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden cursor-pointer"
      @click="navigateToDetail"
    >
      <!-- Main Image -->
      <img
        :src="primaryImage"
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />

      <!-- Optional Secondary Image on Hover -->
      <img
        v-if="secondaryImage"
        :src="secondaryImage"
        :alt="product.name"
        class="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      />

      <!-- Floating Badges Container -->
      <div class="absolute top-3.5 left-3.5 flex flex-col gap-2 z-10 items-start pointer-events-none">
        <!-- Floating Category Badge -->
        <span
          v-if="product.category || product.subCategory"
          class="bg-white/90 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-slate-700 px-3 py-1 rounded-full shadow-sm"
        >
          {{ product.subCategory || product.category }}
        </span>

        <!-- NEW Badge -->
        <span
          v-if="product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)"
          class="bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
        >
          New
        </span>

        <!-- Discount Badge -->
        <span
          v-if="product.discount > 0"
          class="bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
        >
          -{{ product.discount }}%
        </span>
      </div>

      <!-- Floating Wishlist Button -->
      <button
        type="button"
        @click="toggleWishlist"
        class="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-rose-500"
        :title="isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'"
      >
        <Heart
          class="w-4 h-4 transition-colors"
          :class="isWishlisted ? 'text-rose-500 fill-rose-500' : ''"
        />
      </button>

      <!-- Hover Overlay with Quick View Button -->
      <div
        class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-4"
      >
        <button
          type="button"
          @click="openQuickView"
          class="px-5 py-2.5 bg-white/95 backdrop-blur-md text-slate-900 font-bold text-xs rounded-full shadow-xl hover:bg-indigo-600 hover:text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
        >
          <Eye class="w-4 h-4" />
          <span>Quick View</span>
        </button>
      </div>
    </div>

    <!-- Card Body -->
    <div class="p-5 flex flex-col flex-grow">
      
      <!-- Rating & Stock Status -->
      <div class="flex flex-wrap items-center justify-between gap-y-1 mb-2">
        <div class="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
          <Star 
            v-for="i in 5" 
            :key="i" 
            class="w-3.5 h-3.5 shrink-0"
            :class="i <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'" 
          />
          <span class="text-xs font-semibold text-slate-600 ml-1">{{ Number(product.rating || 0).toFixed(1) }}</span>
          <span class="text-xs text-slate-400">({{ product.numReviews || 0 }})</span>
        </div>
        <span
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          :class="currentStock > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'"
        >
          {{ currentStock > 0 ? 'In Stock' : 'Out of Stock' }}
        </span>
      </div>

      <!-- Title -->
      <h3
        @click="navigateToDetail"
        class="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-1 cursor-pointer"
        :title="product.name"
      >
        {{ product.name }}
      </h3>

      <!-- Short Description -->
      <p class="hidden sm:block text-xs text-slate-500 line-clamp-1 mb-3">
        {{ product.description || 'Premium quality modern style.' }}
      </p>

      <!-- Colors Swatches Bar (If available) -->
      <div v-if="displayColors && displayColors.length > 0" class="mb-2 sm:mb-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Colors:</span>
          <button
            v-for="color in displayColors"
            :key="color"
            type="button"
            @click.stop="selectedColor = color"
            @mouseenter="selectedColor = color"
            :class="[
              'w-5 h-5 rounded-full border shadow-sm transition-all flex items-center justify-center',
              selectedColor.toLowerCase() === color.toLowerCase()
                ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110'
                : 'hover:scale-110 border-slate-200'
            ]"
            :style="{ backgroundColor: getColorStyle(color) }"
            :title="`View ${color}`"
          >
            <Check
              v-if="selectedColor.toLowerCase() === color.toLowerCase()"
              class="w-2.5 h-2.5"
              :class="color.toLowerCase() === 'white' || color.toLowerCase() === '#ffffff' ? 'text-slate-900' : 'text-white'"
            />
          </button>
        </div>
      </div>

      <!-- Sizes Pills Bar (If available) -->
      <div v-if="product.sizes && product.sizes.length > 0" class="mb-3 sm:mb-4">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Sizes:</span>
          <button
            v-for="size in product.sizes"
            :key="size"
            type="button"
            @click.stop="selectedSize = size"
            :class="[
              'h-6 px-2 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all border flex items-center justify-center',
              selectedSize === size
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
            ]"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <!-- Bottom Row: Price & Add to Cart Button -->
      <div class="mt-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Price -->
        <div class="flex flex-col">
          <span class="text-[10px] sm:text-xs text-slate-400 font-medium">Price</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-lg sm:text-xl font-black text-slate-900">
              ${{ (product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price)?.toFixed(2) }}
            </span>
            <span v-if="product.discount > 0" class="text-xs sm:text-sm font-semibold text-slate-400 line-through decoration-rose-500/50">
              ${{ product.price?.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Add to Cart Button -->
        <button
          type="button"
          @click="handleQuickAddToCart"
          :disabled="isAdding || currentStock <= 0"
          class="w-full sm:flex-1 sm:max-w-[150px] py-2 sm:py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          <ShoppingBag class="w-3.5 h-3.5 transition-transform group-hover/btn:-translate-y-0.5" />
          <span>{{ currentStock <= 0 ? 'Out of Stock' : (isAdding ? 'Added!' : 'Add to Cart') }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
