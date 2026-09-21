<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { X, Star, ShoppingBag, Heart, Check, ExternalLink, ShieldCheck, Truck, MessageSquare, Send, UserCheck } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])
const router = useRouter()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const ui = useUIStore()
const authStore = useAuthStore()

const reviewRating = ref(5)
const hoverRating = ref(0)
const reviewComment = ref('')
const isSubmittingReview = ref(false)

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!'
}

const submitReview = async () => {
  if (!reviewComment.value.trim()) {
    ui.toast('Please write a comment for your review.', 'error')
    return
  }

  if (!authStore.isAuthenticated) {
    ui.toast('Please log in to write a review.', 'info')
    emit('close')
    router.push('/login')
    return
  }

  isSubmittingReview.value = true
  try {
    await api.post(`/products/${props.product._id}/reviews`, {
      rating: reviewRating.value,
      comment: reviewComment.value
    })
    
    reviewComment.value = ''
    reviewRating.value = 5
    hoverRating.value = 0
    
    ui.toast('Review submitted successfully!', 'success')
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to submit review'
    ui.toast(msg, 'error')
  } finally {
    isSubmittingReview.value = false
  }
}

const activeImageIndex = ref(0)
const overrideImage = ref(null)
const selectedSize = ref('')
const selectedColor = ref('')
const quantity = ref(1)
const isAdding = ref(false)

const displayColors = computed(() => {
  if (props.product?.colorVariants && props.product.colorVariants.length > 0) {
    return props.product.colorVariants.map(v => v.color)
  }
  return props.product?.colors || []
})

const currentVariant = computed(() => {
  if (!selectedColor.value || !props.product?.colorVariants) return null
  return props.product.colorVariants.find(
    v => v.color.toLowerCase() === selectedColor.value.toLowerCase()
  )
})

const maxStockForSelection = computed(() => {
  if (currentVariant.value && currentVariant.value.sizeVariants && selectedSize.value) {
    const sv = currentVariant.value.sizeVariants.find(s => s.size === selectedSize.value)
    if (sv) return sv.stock
  }
  if (currentVariant.value && currentVariant.value.stock !== undefined) {
    return currentVariant.value.stock
  }
  return props.product?.stock ?? 10
})

// Gallery images: ONLY show the active color's photos!
const images = computed(() => {
  if (!props.product) return []
  
  // 1. If active color has its own photos, show ONLY this color's photos!
  if (currentVariant.value) {
    const variantImgs = (currentVariant.value.images && currentVariant.value.images.length > 0)
      ? currentVariant.value.images
      : (currentVariant.value.image ? [currentVariant.value.image] : [])
    
    if (variantImgs.length > 0) {
      return variantImgs
    }
  }

  // 2. Otherwise fallback to general product images
  if (props.product.images && props.product.images.length > 0) {
    return props.product.images
  }

  return [props.product.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1480']
})

const currentImage = computed(() => {
  return images.value[activeImageIndex.value] || images.value[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1480'
})

const selectColor = (color) => {
  selectedColor.value = color
  activeImageIndex.value = 0 // Reset to 1st photo of this color
}

// Reset state when a new product is selected
watch(() => props.product, (newVal) => {
  if (newVal) {
    activeImageIndex.value = 0
    quantity.value = 1
    selectedSize.value = newVal.sizes && newVal.sizes.length > 0 ? newVal.sizes[0] : ''
    const initialColor = newVal.colorVariants?.[0]?.color || (newVal.colors && newVal.colors.length > 0 ? newVal.colors[0] : '')
    selectedColor.value = initialColor || ''
    reviewComment.value = ''
    reviewRating.value = 5
  }
}, { immediate: true })

const isWishlisted = computed(() => {
  if (!props.product) return false
  return wishlistStore.items.some(item => (item._id || item) === props.product._id)
})

const toggleWishlist = async () => {
  if (!props.product) return
  if (isWishlisted.value) {
    await wishlistStore.removeFromWishlist(props.product._id)
    ui.toast('Removed from wishlist', 'info')
  } else {
    await wishlistStore.addToWishlist(props.product._id)
    ui.toast('Added to wishlist!', 'success')
  }
}

const handleAddToCart = () => {
  if (!props.product) return
  if (props.product.sizes?.length && !selectedSize.value) {
    ui.toast('Please select a size', 'error')
    return
  }
  if (props.product.colors?.length && !selectedColor.value) {
    ui.toast('Please select a color', 'error')
    return
  }

  if (maxStockForSelection.value <= 0) {
    ui.toast('This variant is out of stock', 'error')
    return
  }
  
  if (quantity.value > maxStockForSelection.value) {
    ui.toast(`Only ${maxStockForSelection.value} in stock for this variant.`, 'error')
    return
  }

  isAdding.value = true
  
  try {
    cartStore.addToCart(
      props.product,
      quantity.value,
      selectedSize.value || null,
      selectedColor.value || null
    )
    ui.toast(`Added ${quantity.value}x "${props.product.name}" to cart!`, 'success')
  } catch (error) {
    ui.toast(error.message || 'Failed to add to cart', 'error')
  }

  setTimeout(() => {
    isAdding.value = false
    emit('close')
  }, 400)
}

const viewFullDetails = () => {
  if (!props.product) return
  emit('close')
  router.push(`/product/${props.product._id}`)
}

// Helper to convert standard color names to CSS colors
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
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && product"
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out transform"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in transform"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="isOpen && product"
            class="relative w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden border-0 sm:border border-slate-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col md:flex-row"
            @click.stop
          >
            <!-- Close Button -->
            <button
              @click="emit('close')"
              class="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-md cursor-pointer"
              title="Close modal"
            >
              <X class="w-5 h-5" />
            </button>

            <!-- Left: Media & Gallery -->
            <div class="md:w-1/2 p-0 sm:p-6 bg-slate-50 flex flex-col justify-between flex-shrink-0">
              <!-- Main Image with zoom hover -->
              <div class="relative w-full aspect-[4/5] sm:aspect-square rounded-t-3xl sm:rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                <img
                  :src="currentImage"
                  :alt="product.name"
                  class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                
                <!-- Badges -->
                <div class="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
                  <span class="bg-white/90 backdrop-blur-md text-[11px] font-bold text-slate-800 px-3 py-1 rounded-full shadow-sm">
                    {{ product.category || 'Fashion' }}
                  </span>
                  <span
                    v-if="product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)"
                    class="bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
                  >
                    New
                  </span>
                  <span
                    v-if="product.discount > 0"
                    class="bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
                  >
                    -{{ product.discount }}%
                  </span>
                </div>
              </div>

              <!-- Thumbnails -->
              <div v-if="images.length > 1" class="flex flex-wrap items-center gap-2 mt-3 p-2 sm:p-1">
                <button
                  v-for="(img, idx) in images"
                  :key="idx"
                  @click="activeImageIndex = idx"
                  :class="[
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer',
                    activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-600/30 scale-110 z-10' : 'border-slate-200 opacity-70 hover:opacity-100'
                  ]"
                >
                  <img :src="img" class="w-full h-full object-cover" />
                </button>
              </div>

              <!-- Trust perks -->
              <div class="mt-3 pt-3 border-t border-slate-200/60 hidden sm:grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div class="flex items-center gap-1.5">
                  <Truck class="w-4 h-4 text-indigo-500" />
                  <span>Fast Delivery</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <ShieldCheck class="w-4 h-4 text-emerald-500" />
                  <span>100% Authentic</span>
                </div>
              </div>
            </div>

            <!-- Right: Product Info & Actions -->
            <div class="md:w-1/2 p-4 sm:p-8 flex flex-col md:overflow-y-auto md:max-h-[90vh]">
              <!-- Title & Rating -->
              <div class="mb-3 sm:mb-4">
                <span class="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-indigo-600">
                  {{ product.subCategory || product.category }}
                </span>
                <h2 class="text-lg sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1 leading-tight">
                  {{ product.name }}
                </h2>

                <div class="flex items-center gap-2 mt-2">
                  <div class="flex items-center">
                    <Star 
                      v-for="i in 5" 
                      :key="i" 
                      class="w-4 h-4"
                      :class="i <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                    />
                  </div>
                  <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ Number(product.rating || 0).toFixed(1) }}</span>
                  <span class="text-[10px] sm:text-xs text-slate-400">({{ product.numReviews || 0 }} reviews)</span>
                  <span
                    class="ml-auto text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold whitespace-nowrap"
                    :class="maxStockForSelection > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                  >
                    {{ maxStockForSelection > 0 ? 'In Stock' : 'Out of Stock' }}
                  </span>
                </div>
              </div>

              <!-- Price -->
              <div class="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-5 border-b border-slate-100">
                <span class="text-xl sm:text-3xl font-black text-slate-900">${{ (product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price)?.toFixed(2) }}</span>
                <span v-if="product.discount > 0" class="text-sm sm:text-lg text-slate-400 line-through">
                  ${{ product.price?.toFixed(2) }}
                </span>
              </div>

              <!-- Description -->
              <p class="hidden sm:block text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                {{ product.description || 'Premium modern fashion piece tailored for exceptional style, comfort and daily versatility.' }}
              </p>

              <!-- Color Selection -->
              <div v-if="displayColors && displayColors.length > 0" class="mb-4 sm:mb-5">
                <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
                    Color: <span class="text-indigo-600 capitalize font-medium">{{ selectedColor }}</span>
                  </label>
                </div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <button
                    v-for="color in displayColors"
                    :key="color"
                    type="button"
                    @click="selectColor(color)"
                    :class="[
                      'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all relative border shadow-sm',
                      selectedColor.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110'
                        : 'hover:scale-105 border-slate-200'
                    ]"
                    :style="{ backgroundColor: getColorStyle(color) }"
                    :title="color"
                  >
                    <Check
                      v-if="selectedColor.toLowerCase() === color.toLowerCase()"
                      class="w-4 h-4"
                      :class="color.toLowerCase() === 'white' || color.toLowerCase() === '#ffffff' ? 'text-slate-900' : 'text-white'"
                    />
                  </button>
                </div>
              </div>

              <!-- Size Selection -->
              <div v-if="product.sizes && product.sizes.length > 0" class="mb-5 sm:mb-6">
                <div class="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
                    Size: <span class="text-indigo-600 font-medium">{{ selectedSize }}</span>
                  </label>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-for="size in product.sizes"
                    :key="size"
                    type="button"
                    @click="selectedSize = size"
                    :class="[
                      'min-w-[36px] sm:min-w-[44px] h-8 sm:h-10 px-2 sm:px-3.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all border flex items-center justify-center',
                      selectedSize === size
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    ]"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>

              <!-- Quantity & Actions -->
              <div class="mt-auto pt-3 sm:pt-4 border-t border-slate-100 space-y-3 sm:space-y-4">
                <div class="flex items-center gap-2 sm:gap-4">
                  <!-- Stepper -->
                  <div class="flex items-center border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50/50 p-0.5 sm:p-1">
                    <button
                      type="button"
                      @click="quantity = Math.max(1, quantity - 1)"
                      class="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span class="w-8 sm:w-10 text-center font-bold text-slate-900 text-[11px] sm:text-sm">
                      {{ quantity }}
                    </span>
                    <button
                      type="button"
                      @click="quantity < maxStockForSelection && quantity++"
                      :class="['w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg shadow-sm flex items-center justify-center font-bold transition-colors', quantity >= maxStockForSelection ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-100']"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    @click="handleAddToCart"
                    :disabled="isAdding || maxStockForSelection <= 0"
                    class="flex-1 py-2 sm:py-3.5 px-3 sm:px-6 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag class="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    <span>{{ maxStockForSelection <= 0 ? 'Out of Stock' : (isAdding ? 'Adding...' : 'Add to Cart') }}</span>
                  </button>

                  <!-- Wishlist Button -->
                  <button
                    type="button"
                    @click="toggleWishlist"
                    class="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border border-slate-200 flex items-center justify-center transition-colors hover:bg-rose-50 hover:border-rose-200"
                    :title="isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'"
                  >
                    <Heart
                      class="w-5 h-5 transition-colors"
                      :class="isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'"
                    />
                  </button>
                </div>

                <!-- Full Page Link -->
                <button
                  type="button"
                  @click="viewFullDetails"
                  class="w-full text-center text-[10px] sm:text-xs text-slate-500 hover:text-indigo-600 font-medium py-1 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View Full Product Details</span>
                  <ExternalLink class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              <!-- Write a Review Section -->
              <div class="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 hidden sm:block">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare class="w-4 h-4 text-indigo-500" />
                    Quick Review
                  </h3>
                  <span v-if="authStore.isAuthenticated" class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <UserCheck class="w-3 h-3" /> Logged In
                  </span>
                </div>

                <div v-if="!authStore.isAuthenticated" class="text-center py-4 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p class="text-xs text-slate-500 mb-2">Log in to leave a quick review.</p>
                  <button
                    @click="emit('close'); router.push('/login')"
                    class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition"
                  >
                    Log In
                  </button>
                </div>
                
                <form v-else @submit.prevent="submitReview" class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1 p-1.5 bg-slate-50 rounded-lg border border-slate-200/80">
                      <button
                        v-for="star in 5"
                        :key="star"
                        type="button"
                        @click="reviewRating = star"
                        @mouseenter="hoverRating = star"
                        @mouseleave="hoverRating = 0"
                        class="p-0.5 rounded transition-transform transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          class="w-4 h-4 transition-colors duration-150"
                          :class="star <= (hoverRating || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
                        />
                      </button>
                    </div>
                    <span class="text-[10px] font-bold text-slate-500">{{ ratingLabels[hoverRating || reviewRating] }}</span>
                  </div>

                  <textarea
                    v-model="reviewComment"
                    rows="2"
                    required
                    placeholder="What did you think of this product?"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
                  ></textarea>

                  <div class="flex justify-end">
                    <button
                      type="submit"
                      :disabled="isSubmittingReview"
                      class="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <template v-if="isSubmittingReview">
                        <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </template>
                      <template v-else>
                        <Send class="w-3 h-3" />
                        <span>Post Review</span>
                      </template>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
