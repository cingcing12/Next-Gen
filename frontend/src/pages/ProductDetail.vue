<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star, ShieldCheck, MapPin, Check, Heart, ChevronRight, ChevronDown, ChevronUp, ThumbsUp, MessageSquare, Send, Sparkles, UserCheck, Award, ArrowRight } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import ProductCard from '../components/ProductCard.vue'
import ProductQuickViewModal from '../components/ProductQuickViewModal.vue'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()
const ui = useUIStore()

const product = ref(null)
const loading = ref(true)
const error = ref(null)
const selectedImage = ref(0)
const selectedSize = ref('')
const selectedColor = ref('')
const quantity = ref(1)

const reviewRating = ref(5)
const hoverRating = ref(0)
const reviewComment = ref('')
const isSubmittingReview = ref(false)
const helpfulReviews = ref({})

const markHelpful = (reviewId) => {
  if (helpfulReviews.value[reviewId]) return
  helpfulReviews.value[reviewId] = true
  ui.toast('Marked review as helpful!', 'success')
}

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!'
}

const currentVariant = computed(() => {
  if (!selectedColor.value || !product.value?.colorVariants) return null
  return product.value.colorVariants.find(
    v => v.color.toLowerCase() === selectedColor.value.toLowerCase()
  )
})

const maxAvailableStock = computed(() => {
  if (currentVariant.value && currentVariant.value.sizeVariants && selectedSize.value) {
    const sv = currentVariant.value.sizeVariants.find(
      s => s.size === selectedSize.value
    )
    return sv ? sv.stock : 0
  }
  // Fallback for old products without sizeVariants
  if (currentVariant.value && currentVariant.value.stock !== undefined) {
    return currentVariant.value.stock
  }
  return product.value?.stock || 0
})

const currentPrice = computed(() => {
  if (currentVariant.value && currentVariant.value.sizeVariants && selectedSize.value) {
    const sv = currentVariant.value.sizeVariants.find(s => s.size === selectedSize.value)
    if (sv && sv.price !== undefined && sv.price !== null && sv.price > 0) {
      return sv.price
    }
  }
  return product.value?.price || 0
})

const discountedPrice = computed(() => {
  if (!product.value || !product.value.discount) return currentPrice.value
  return currentPrice.value * (1 - product.value.discount / 100)
})

const increaseQuantity = () => {
  if (quantity.value < maxAvailableStock.value) {
    quantity.value++
  } else {
    ui.toast(`Only ${maxAvailableStock.value} in stock for ${selectedColor.value} / ${selectedSize.value}.`, 'error')
  }
}

// Ensure quantity doesn't exceed new stock when switching colors or sizes
watch([maxAvailableStock], ([newMax]) => {
  if (quantity.value > newMax) {
    quantity.value = newMax > 0 ? newMax : 1
  }
})

// Gallery images: ONLY show the active color's photos!
const activeGalleryImages = computed(() => {
  if (!product.value) return []
  
  // 1. If active color has its own photos, show ONLY this color's photos!
  if (currentVariant.value) {
    const varImgs = (currentVariant.value.images && currentVariant.value.images.length > 0)
      ? currentVariant.value.images
      : (currentVariant.value.image ? [currentVariant.value.image] : [])
    
    if (varImgs.length > 0) {
      return varImgs
    }
  }

  // 2. Otherwise fallback to general product images
  if (product.value.images && product.value.images.length > 0) {
    return product.value.images
  }

  return [product.value.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1480']
})

const displayColors = computed(() => {
  let colors = []
  if (product.value?.colorVariants && product.value.colorVariants.length > 0) {
    colors = product.value.colorVariants.map(v => v.color)
  } else {
    colors = product.value?.colors || []
  }
  return colors.filter(c => c && c.toLowerCase() !== 'default' && c.toLowerCase() !== 'no color')
})

const selectColor = (color) => {
  selectedColor.value = color
  selectedImage.value = 0 // Reset to 1st photo of this color
}

// Review statistics breakdown
const reviewBreakdown = computed(() => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const reviews = product.value?.reviews || []
  const total = reviews.length
  
  if (total > 0) {
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating) || 5))
      counts[star]++
    })
  }

  return [5, 4, 3, 2, 1].map(stars => {
    const count = counts[stars]
    const percentage = total > 0 ? Math.round((count / total) * 100) : (stars === 5 ? 100 : 0)
    return { stars, count, percentage }
  })
})

const averageRating = computed(() => {
  const reviews = product.value?.reviews || []
  if (reviews.length === 0) {
    return (product.value?.rating || 4.8).toFixed(1)
  }
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0)
  return (sum / reviews.length).toFixed(1)
})

const fetchProduct = async () => {
  try {
    loading.value = true
    const { data } = await api.get(`/products/${route.params.id}`)
    
    // Redirect if unpublished and not admin
    if (data.isPublished === false && !authStore.isAdmin) {
      ui.toast('This product is currently unavailable.', 'error')
      router.push('/shop')
      return
    }

    product.value = data
    if (data.sizes?.length) selectedSize.value = data.sizes[0]
    
    // Automatically select first color
    const initialColor = data.colorVariants?.[0]?.color || (data.colors?.length ? data.colors[0] : '')
    selectedColor.value = initialColor || ''
    selectedImage.value = 0
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load product'
  } finally {
    loading.value = false
    // Fetch related products after loading current product
    if (product.value) fetchRelatedProducts()
  }
}

const relatedProducts = ref([])
const isFetchingRelated = ref(false)
const quickViewProduct = ref(null)
const isQuickViewOpen = ref(false)

const handleQuickView = (p) => {
  quickViewProduct.value = p
  isQuickViewOpen.value = true
}

const closeQuickView = () => {
  isQuickViewOpen.value = false
  quickViewProduct.value = null
}

const fetchRelatedProducts = async () => {
  if (!product.value) return
  isFetchingRelated.value = true
  try {
    const { data } = await api.get('/products')
    let list = Array.isArray(data) ? data : (data.products || [])
    list = list.filter(p => p.isPublished !== false)
    const currentId = String(product.value._id)
    const currentCat = (product.value.category || '').toLowerCase()

    // 1. Same category first
    const sameCat = list.filter(p => String(p._id) !== currentId && (p.category || '').toLowerCase() === currentCat)
    // 2. Different category to fill up to 4 items
    const diffCat = list.filter(p => String(p._id) !== currentId && (p.category || '').toLowerCase() !== currentCat)

    relatedProducts.value = [...sameCat, ...diffCat].slice(0, 4)
  } catch (err) {
    console.error('Failed to load related products:', err)
  } finally {
    isFetchingRelated.value = false
  }
}

const handleProductUpdated = (e) => {
  if (e.detail && product.value && e.detail._id === product.value._id) {
    if (e.detail.deleted) {
      ui.toast('This product has been removed by an admin.', 'error')
      router.push('/shop')
    } else {
      // Re-fetch to get latest stock/data cleanly
      fetchProduct()
    }
  }
}

onMounted(() => {
  fetchProduct()
  window.addEventListener('system:product_updated', handleProductUpdated)
})

onUnmounted(() => {
  window.removeEventListener('system:product_updated', handleProductUpdated)
})

// Scroll to top and reload when navigating between related products
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      fetchProduct()
    }
  }
)

const isAddingToCart = ref(false)
const addToCart = async () => {
  if (isAddingToCart.value) return
  const hasSizes = product.value?.sizes?.length > 0
  const hasColors = displayColors.value.length > 0

  if (hasSizes && !selectedSize.value) {
    ui.toast('Please select a size before adding to cart.', 'error')
    return
  }
  if (hasColors && !selectedColor.value) {
    ui.toast('Please select a color before adding to cart.', 'error')
    return
  }
  if (quantity.value > maxAvailableStock.value) {
    ui.toast(`Only ${maxAvailableStock.value} in stock for ${selectedColor.value} / ${selectedSize.value}.`, 'error')
    return
  }
  isAddingToCart.value = true
  cartStore.addToCart(product.value, quantity.value, selectedSize.value, selectedColor.value)
  ui.toast('Added to cart!', 'success')
  setTimeout(() => { isAddingToCart.value = false }, 1000)
}

const submitReview = async () => {
  if (!reviewComment.value.trim()) {
    ui.toast('Please write a comment for your review.', 'error')
    return
  }

  if (!authStore.isAuthenticated) {
    ui.toast('Please log in to write a review.', 'info')
    router.push('/login')
    return
  }

  isSubmittingReview.value = true
  try {
    await api.post(`/products/${route.params.id}/reviews`, {
      rating: reviewRating.value,
      comment: reviewComment.value
    })
    
    // Reset form
    reviewComment.value = ''
    reviewRating.value = 5
    hoverRating.value = 0
    
    // Toast alert as requested!
    ui.toast('Review submitted successfully! Thank you for your feedback.', 'success')
    
    // Refresh product to show the new review immediately
    await fetchProduct()
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to submit review'
    ui.toast(msg, 'error')
  } finally {
    isSubmittingReview.value = false
  }
}

const isTogglingWishlist = ref(false)
const toggleWishlist = async () => {
  if (isTogglingWishlist.value) return
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  isTogglingWishlist.value = true
  const inWishlist = wishlistStore.items.find(item => item._id === product.value._id)
  if (inWishlist) {
    await wishlistStore.removeFromWishlist(product.value._id)
  } else {
    await wishlistStore.addToWishlist(product.value._id)
  }
  isTogglingWishlist.value = false
}

const isInWishlist = computed(() => {
  return wishlistStore.items.some(item => item._id === product.value?._id)
})

const isReviewsExpanded = ref(false)
</script>

<template>
  <div class="bg-white">
    <!-- Loading Skeleton -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 animate-pulse">
      
      <!-- Breadcrumb Skeleton -->
      <div class="flex items-center gap-2 mb-10 pb-4 border-b border-slate-100">
        <div class="w-12 h-4 bg-slate-200 rounded"></div>
        <div class="w-4 h-4 bg-slate-200 rounded"></div>
        <div class="w-16 h-4 bg-slate-200 rounded"></div>
        <div class="w-4 h-4 bg-slate-200 rounded"></div>
        <div class="w-32 h-4 bg-slate-200 rounded"></div>
      </div>

      <div class="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 items-start">
        
        <!-- Image Gallery Skeleton -->
        <div class="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
          <div class="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible lg:w-24 flex-shrink-0">
            <div v-for="i in 4" :key="i" class="w-20 h-24 lg:w-full lg:h-32 rounded-xl bg-slate-200 flex-shrink-0"></div>
          </div>
          <div class="flex-grow rounded-3xl bg-slate-200 aspect-[3/4] lg:aspect-auto lg:h-[620px]"></div>
        </div>

        <!-- Product Info Skeleton -->
        <div class="mt-10 px-4 sm:px-0 lg:mt-0 space-y-8">
          
          <!-- Title & Price -->
          <div>
            <div class="w-3/4 h-10 bg-slate-200 rounded-lg mb-4"></div>
            <div class="flex items-center justify-between">
              <div class="w-24 h-8 bg-slate-200 rounded-lg"></div>
              <div class="flex items-center gap-2">
                <div class="flex gap-1">
                  <div v-for="i in 5" :key="i" class="w-5 h-5 bg-slate-200 rounded-full"></div>
                </div>
                <div class="w-20 h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-3">
            <div class="w-full h-4 bg-slate-200 rounded"></div>
            <div class="w-full h-4 bg-slate-200 rounded"></div>
            <div class="w-2/3 h-4 bg-slate-200 rounded"></div>
          </div>

          <div class="border-t border-slate-100 pt-8 space-y-8">
            <!-- Colors Skeleton -->
            <div>
              <div class="w-24 h-4 bg-slate-200 rounded mb-4"></div>
              <div class="flex gap-3">
                <div v-for="i in 4" :key="i" class="w-10 h-10 bg-slate-200 rounded-full"></div>
              </div>
            </div>

            <!-- Sizes Skeleton -->
            <div>
              <div class="flex justify-between mb-4">
                <div class="w-12 h-4 bg-slate-200 rounded"></div>
                <div class="w-20 h-4 bg-slate-200 rounded"></div>
              </div>
              <div class="grid grid-cols-4 gap-3">
                <div v-for="i in 4" :key="i" class="h-12 bg-slate-200 rounded-xl"></div>
              </div>
            </div>

            <!-- Action Buttons Skeleton -->
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="h-14 sm:w-32 bg-slate-200 rounded-xl"></div>
              <div class="flex-1 h-14 bg-slate-200 rounded-xl"></div>
              <div class="w-14 h-14 bg-slate-200 rounded-xl"></div>
            </div>

            <!-- Features Skeleton -->
            <div class="pt-8 border-t border-slate-100 space-y-4">
              <div v-for="i in 3" :key="i" class="flex items-center gap-3">
                <div class="w-5 h-5 bg-slate-200 rounded-full"></div>
                <div class="w-48 h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 text-center py-20 text-red-500">
      {{ error }}
    </div>
    <div v-else-if="product">
      <!-- Breadcrumb -->
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-slate-100 flex items-center text-[10px] sm:text-sm text-slate-500">
        <router-link to="/" class="hover:text-indigo-600 transition-colors">Home</router-link>
        <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2 text-slate-400" />
        <router-link :to="`/shop/${product.category.toLowerCase()}`" class="hover:text-indigo-600 transition-colors capitalize">{{ product.category }}</router-link>
        <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2 text-slate-400" />
        <span class="text-slate-900 uppercase truncate">{{ product.name }}</span>
      </nav>

      <!-- Product Layout -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16">
        <div class="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16 items-start">
          
          <!-- Image Gallery (Sticky on Desktop) -->
          <div class="flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 lg:gap-6 lg:sticky lg:top-24 self-start">
            <div class="flex lg:flex-col gap-2 sm:gap-4 overflow-x-auto lg:overflow-visible lg:w-24 flex-shrink-0 hide-scrollbar py-2 px-2 lg:p-0">
              <button 
                v-for="(img, idx) in activeGalleryImages" 
                :key="idx"
                @click="selectedImage = idx"
                :class="[
                  'relative w-16 h-20 sm:w-20 sm:h-24 lg:w-full lg:h-32 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 focus:outline-none transition-all cursor-pointer',
                  selectedImage === idx ? 'ring-2 ring-indigo-600 ring-offset-2 scale-[1.02] z-10' : 'opacity-70 hover:opacity-100'
                ]"
              >
                <img :src="img" class="w-full h-full object-cover" alt="Product thumbnail" />
              </button>
            </div>
            
            <div class="flex-grow rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 aspect-[4/5] lg:aspect-auto lg:h-[620px] relative border border-slate-100 shadow-sm">
              <transition name="fade">
                <img :key="selectedImage" :src="activeGalleryImages[selectedImage] || activeGalleryImages[0]" class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-200" alt="Product image" />
              </transition>
            </div>
          </div>

          <!-- Product Info -->
          <div class="mt-6 sm:mt-10 px-0 lg:mt-0 lg:sticky lg:top-24 self-start">
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{{ product.name }}</h1>
              <span
                v-if="product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)"
                class="bg-rose-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
              >
                New
              </span>
            </div>
          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-baseline gap-2 sm:gap-3">
              <p class="text-2xl sm:text-3xl font-bold text-slate-900">${{ discountedPrice.toFixed(2) }}</p>
              <p v-if="product.discount > 0" class="text-lg sm:text-xl font-semibold text-slate-400 line-through decoration-rose-500/50">${{ currentPrice.toFixed(2) }}</p>
              <span v-if="product.discount > 0" class="bg-indigo-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm">
                -{{ product.discount }}%
              </span>
            </div>
            
            <div class="flex items-center space-x-1 sm:space-x-2">
              <div class="flex items-center text-yellow-400">
                <Star v-for="i in 5" :key="i" :class="[i <= Math.round(product.rating) ? 'fill-yellow-400' : 'text-slate-200']" class="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <a href="#reviews" class="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {{ product.numReviews }} reviews
              </a>
            </div>
          </div>

          <div class="mt-4 sm:mt-6">
            <h3 class="sr-only">Description</h3>
            <p class="text-sm sm:text-base text-slate-600 leading-relaxed">{{ product.description }}</p>
          </div>

          <div class="mt-6 sm:mt-8 border-t border-slate-100 pt-6 sm:pt-8">
            <!-- Colors -->
            <div class="mb-5 sm:mb-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                  Color: <span class="text-indigo-600 font-semibold capitalize">{{ selectedColor }}</span>
                </h3>
              </div>
              <div class="mt-2 flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
                <button
                  v-for="color in (displayColors.length ? displayColors : product.colors)"
                  :key="color"
                  @click="selectColor(color)"
                  :class="[
                    'relative w-8 h-8 sm:w-10 sm:h-10 rounded-full focus:outline-none transition-all flex items-center justify-center border shadow-sm',
                    selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'border-slate-200 hover:scale-105'
                  ]"
                  :style="{ backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() === 'black' ? '#0f172a' : color.toLowerCase() === 'navy' ? '#1e3a8a' : color }"
                  :title="`Select ${color}`"
                >
                  <Check v-if="selectedColor.toLowerCase() === color.toLowerCase()" class="w-4 h-4 sm:w-5 sm:h-5" :class="color.toLowerCase() === 'white' ? 'text-slate-900' : 'text-white'" />
                </button>
              </div>
            </div>

            <!-- Sizes -->
            <div class="mb-6 sm:mb-8">
              <div class="flex justify-between items-center mb-2 sm:mb-3">
                <h3 class="text-xs sm:text-sm font-medium text-slate-900">Size</h3>
                <a href="#" class="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-500">Size Guide</a>
              </div>
              <div class="grid grid-cols-4 gap-2 sm:gap-3">
                <button
                  v-for="size in product.sizes"
                  :key="size"
                  @click="selectedSize = size"
                  :class="[
                    'border rounded-lg sm:rounded-xl py-2 sm:py-3 px-2 sm:px-4 flex items-center justify-center text-xs sm:text-sm font-medium transition-all',
                    selectedSize === size ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-900 hover:bg-slate-50'
                  ]"
                >
                  {{ size }}
                </button>
              </div>
            </div>
            
            <!-- Quantity and Add to Cart -->
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div class="flex items-center border border-slate-200 rounded-lg sm:rounded-xl h-12 sm:h-14 sm:w-32 bg-white" :class="{ 'opacity-50 pointer-events-none': maxAvailableStock === 0 }">
                <button @click="quantity > 1 && quantity--" class="px-3 sm:px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors">-</button>
                <span class="flex-grow text-center font-medium text-sm sm:text-base text-slate-900">{{ quantity }}</span>
                <button @click="increaseQuantity" class="px-3 sm:px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors">+</button>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex space-x-3 sm:space-x-4 flex-grow">
                <button 
                  @click="addToCart"
                  :disabled="maxAvailableStock === 0"
                  :class="[
                    'flex-1 border border-transparent rounded-lg sm:rounded-xl py-3 sm:py-4 px-4 sm:px-8 flex items-center justify-center text-sm sm:text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
                    maxAvailableStock === 0 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5'
                  ]"
                >
                  {{ maxAvailableStock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                </button>
                
                <button 
                  @click="toggleWishlist" 
                  :class="isInWishlist ? 'text-red-500 bg-red-50 border-red-200' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'" 
                  class="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center border rounded-lg sm:rounded-xl transition-colors shadow-sm"
                >
                  <Heart class="w-5 h-5 sm:w-6 sm:h-6" :class="{'fill-current': isInWishlist}" />
                </button>
              </div>
            </div>

            <!-- Features -->
            <div class="mt-10 pt-8 border-t border-slate-100">
              <ul class="space-y-4 text-sm text-slate-500">
                <li class="flex items-center"><Check class="w-5 h-5 text-green-500 mr-3" /> Free shipping on orders over $100</li>
                <li class="flex items-center"><Check class="w-5 h-5 text-green-500 mr-3" /> 30-day return policy</li>
                <li class="flex items-center"><Check class="w-5 h-5 text-green-500 mr-3" /> Secure Bakong KHQR Payments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
      <!-- Reviews Section -->
      <div id="reviews" v-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-t border-slate-200 mt-8 sm:mt-10">
        <!-- Section Header -->
        <div 
          @click="isReviewsExpanded = !isReviewsExpanded"
          class="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-100 gap-3 sm:gap-4 cursor-pointer group select-none"
        >
          <div>
            <div class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 mb-1.5 sm:mb-2 transition-colors group-hover:bg-amber-100">
              <Sparkles class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
              Customer Feedback
            </div>
            <h2 class="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight transition-colors group-hover:text-indigo-600">Customer Ratings & Reviews</h2>
            <p class="text-[10px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Real feedback from verified Next-Gen shoppers</p>
          </div>

          <div class="flex items-center gap-3 sm:gap-4">
            <div class="flex items-center gap-2 sm:gap-3">
              <span class="text-[10px] sm:text-sm text-slate-500 font-medium">Total Reviews:</span>
              <span class="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-900 text-white rounded-full text-[10px] sm:text-xs font-bold shadow-sm">{{ product.reviews?.length || 0 }}</span>
            </div>
            <div class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100 group-hover:border-indigo-100">
              <ChevronUp v-if="isReviewsExpanded" class="w-4 h-4 sm:w-5 sm:h-5" />
              <ChevronDown v-else class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
        
        <div v-show="isReviewsExpanded">
        <!-- Summary & Submission Top Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 mb-8 sm:mb-12">
          
          <!-- Rating Summary & Breakdown (5 cols) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 sm:mb-4">Rating Breakdown</h3>
              
              <div class="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div class="text-center">
                  <div class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">{{ averageRating }}</div>
                  <div class="flex items-center justify-center gap-0.5 mt-1 sm:mt-2">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      class="w-3 h-3 sm:w-4 sm:h-4"
                      :class="i <= Math.round(Number(averageRating)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                    />
                  </div>
                  <p class="text-[9px] sm:text-xs text-slate-500 mt-1 font-medium">out of 5.0</p>
                </div>

                <div class="h-12 sm:h-16 w-px bg-slate-200"></div>

                <div>
                  <div class="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold mb-1 sm:mb-1.5 border border-emerald-100">
                    <ShieldCheck class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    98% Recommended
                  </div>
                  <p class="text-[9px] sm:text-xs text-slate-500 font-medium">
                    Based on {{ product.reviews?.length || 0 }} authentic customer reviews
                  </p>
                </div>
              </div>

              <!-- Rating Progress Bars -->
              <div class="space-y-2 sm:space-y-2.5">
                <div v-for="item in reviewBreakdown" :key="item.stars" class="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div class="flex items-center gap-0.5 sm:gap-1 w-8 sm:w-12 text-slate-600 font-medium">
                    <span>{{ item.stars }}</span>
                    <Star class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div class="flex-1 h-1.5 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      :style="{ width: `${item.percentage}%` }"
                    ></div>
                  </div>
                  <div class="w-8 sm:w-12 text-right text-slate-400 font-mono font-medium text-[9px] sm:text-[10px]">
                    {{ item.percentage }}%
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-slate-200/60 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-2">
              <span class="flex items-center gap-1 sm:gap-1.5">
                <Check class="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" /> 100% Verified purchases
              </span>
              <span class="flex items-center gap-1 sm:gap-1.5">
                <Award class="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" /> Quality assured
              </span>
            </div>
          </div>

          <!-- Write Review Card (7 cols) -->
          <div class="lg:col-span-7 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4 sm:mb-5">
                <div class="flex items-center gap-2 sm:gap-2.5">
                  <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    <MessageSquare class="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 class="text-sm sm:text-base font-bold text-slate-900">Write a Review</h3>
                    <p class="text-[9px] sm:text-xs text-slate-500">Share your thoughts with the community</p>
                  </div>
                </div>
                <span v-if="authStore.isAuthenticated" class="text-[9px] sm:text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold flex items-center gap-1">
                  <UserCheck class="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Logged In
                </span>
              </div>

              <!-- Unauthenticated State -->
              <div v-if="!authStore.isAuthenticated" class="text-center py-6 sm:py-8 px-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <UserCheck class="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 class="text-xs sm:text-sm font-bold text-slate-800 mb-1">Have you tried this product?</h4>
                <p class="text-[10px] sm:text-xs text-slate-500 max-w-sm mx-auto mb-3 sm:mb-4">
                  Log in to your Next-Gen account to leave a verified review and help other shoppers.
                </p>
                <router-link
                  to="/login"
                  class="inline-flex items-center gap-1 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-black text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition shadow-sm hover:shadow"
                >
                  Log In to Review
                </router-link>
              </div>

              <!-- Authenticated Form -->
              <form v-else @submit.prevent="submitReview" class="space-y-3 sm:space-y-4">
                <!-- Interactive Star Picker -->
                <div>
                  <label class="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">
                    Overall Rating <span class="text-red-500">*</span>
                  </label>
                  <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div class="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200/80">
                      <button
                        v-for="star in 5"
                        :key="star"
                        type="button"
                        @click="reviewRating = star"
                        @mouseenter="hoverRating = star"
                        @mouseleave="hoverRating = 0"
                        class="p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-transform transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          class="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-150"
                          :class="star <= (hoverRating || reviewRating) ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-300'"
                        />
                      </button>
                    </div>
                    <span class="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                      {{ ratingLabels[hoverRating || reviewRating] }}
                    </span>
                  </div>
                </div>

                <!-- Review Comment Area -->
                <div>
                  <div class="flex items-center justify-between mb-1 sm:mb-1.5">
                    <label class="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your Review <span class="text-red-500">*</span>
                    </label>
                    <span class="text-[9px] sm:text-xs text-slate-400 font-mono">{{ reviewComment.length }} chars</span>
                  </div>
                  <textarea
                    v-model="reviewComment"
                    rows="3"
                    required
                    placeholder="What did you like or dislike? How was the fit, material quality, and delivery?"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition resize-none"
                  ></textarea>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p class="text-[9px] sm:text-xs text-slate-400">
                    Your review will be posted publicly with your name.
                  </p>
                  <button
                    type="submit"
                    :disabled="isSubmittingReview"
                    class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-[10px] sm:text-xs px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <template v-if="isSubmittingReview">
                      <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </template>
                    <template v-else>
                      <Send class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Post Review</span>
                    </template>
                  </button>
                </div>
              </form>
            </div>
          </div>
          
        </div>

        <!-- Reviews Feed List -->
        <div>
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <span>Customer Reviews</span>
              <span class="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{{ product.reviews?.length || 0 }}</span>
            </h3>
          </div>

          <!-- Empty Reviews State -->
          <div v-if="!product.reviews || product.reviews.length === 0" class="text-center py-10 sm:py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl">
            <div class="w-10 h-10 sm:w-14 sm:h-14 bg-white shadow-sm border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 text-slate-400">
              <MessageSquare class="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h4 class="text-sm sm:text-base font-bold text-slate-800 mb-1">No reviews yet</h4>
            <p class="text-[10px] sm:text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to share your experience with this product! Help fellow shoppers make the right choice.
            </p>
          </div>

          <!-- Reviews Cards Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div
              v-for="review in product.reviews"
              :key="review._id"
              class="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <!-- Reviewer Header -->
                <div class="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-sm uppercase">
                      {{ (review.name || 'U').charAt(0) }}
                    </div>
                    <div>
                      <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h4 class="text-xs sm:text-sm font-bold text-slate-900">{{ review.name || 'Customer' }}</h4>
                        <span class="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                          <Check class="w-2.5 h-2.5 text-emerald-600" /> Verified Buyer
                        </span>
                      </div>
                      <div class="flex items-center gap-1 sm:gap-2 mt-0.5">
                        <div class="flex items-center gap-0.5">
                          <Star
                            v-for="i in 5"
                            :key="i"
                            class="w-3 h-3 sm:w-3.5 sm:h-3.5"
                            :class="i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'"
                          />
                        </div>
                        <span class="text-[9px] sm:text-[11px] font-semibold text-slate-500">{{ ratingLabels[review.rating] || `${review.rating} Stars` }}</span>
                      </div>
                    </div>
                  </div>
                  <span class="text-[9px] sm:text-xs text-slate-400 flex-shrink-0 mt-1">
                    {{ review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent' }}
                  </span>
                </div>

                <!-- Review Content -->
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 sm:mt-3">
                  "{{ review.comment }}"
                </p>
              </div>

              <!-- Helpful Button Reaction -->
              <div class="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                <span>Was this review helpful?</span>
                <button
                  type="button"
                  @click="markHelpful(review._id)"
                  class="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg border transition-colors cursor-pointer"
                  :class="helpfulReviews[review._id] ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
                >
                  <ThumbsUp class="w-3 h-3 sm:w-3.5 sm:h-3.5" :class="helpfulReviews[review._id] ? 'fill-indigo-600' : ''" />
                  <span>{{ helpfulReviews[review._id] ? 'Helpful (1)' : 'Helpful' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- End Collapsible Content -->
        </div>
      </div>

      <!-- Related Products Section -->
      <div v-if="relatedProducts && relatedProducts.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
              <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
              Curated For You
            </div>
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Related Products</h2>
            <p class="text-sm text-slate-500 mt-1">Explore similar styles and trending items in {{ product.category }}</p>
          </div>

          <router-link
            :to="`/shop/${product.category.toLowerCase()}`"
            class="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 group transition-colors"
          >
            <span>See more {{ product.category }}</span>
            <ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </router-link>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <ProductCard
            v-for="relProduct in relatedProducts"
            :key="relProduct._id"
            :product="relProduct"
            @quick-view="handleQuickView"
          />
        </div>
      </div>

      <!-- Quick View Modal for Related Products -->
      <ProductQuickViewModal
        :product="quickViewProduct"
        :isOpen="isQuickViewOpen"
        @close="closeQuickView"
      />

    </div>
  </div>
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
