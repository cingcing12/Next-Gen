<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Filter,
  Star,
  ArrowRight,
  ChevronRight,
  X,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Grid3X3,
  Check,
  RotateCcw,
  Sparkles,
  ShoppingBag
} from 'lucide-vue-next'
import { useCategoryStore } from '../stores/category'
import ProductCard from '../components/ProductCard.vue'
import ProductSkeletonCard from '../components/ProductSkeletonCard.vue'
import ProductQuickViewModal from '../components/ProductQuickViewModal.vue'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

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

const rawProducts = ref([])
const loading = ref(true)
const error = ref(null)

// Filters State
const searchQuery = ref('')
const selectedPriceRange = ref('all') // 'all', 'under25', '25to50', '50to100', 'over100'
const selectedColor = ref('')
const selectedSize = ref('')
const onlyInStock = ref(false)
const minRating = ref(0)
const sortBy = ref('featured') // 'featured', 'price-low', 'price-high', 'rating', 'newest'
const gridCols = ref(3) // 3 or 4
const isMobileFilterOpen = ref(false)
const isDesktopFilterOpen = ref(true)

const category = computed(() => route.params.category || 'all')
const subCategory = computed(() => route.params.subCategory || 'all')

const categories = computed(() => categoryStore.categories.map(c => c.name))

const subCategories = computed(() => {
  if (category.value === 'all') return []
  const selectedCat = categoryStore.categories.find(c => c.name.toLowerCase() === category.value.toLowerCase())
  return selectedCat ? (selectedCat.subcategories || []) : []
})

// Quick Price Range definitions
const priceRanges = [
  { id: 'all', label: 'All Prices' },
  { id: 'under25', label: 'Under $25', min: 0, max: 25 },
  { id: '25to50', label: '$25 - $50', min: 25, max: 50 },
  { id: '50to100', label: '$50 - $100', min: 50, max: 100 },
  { id: 'over100', label: '$100 & Above', min: 100, max: 99999 }
]

// Common fashion colors for filter swatches
const availableColors = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Gray', hex: '#64748b' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Green', hex: '#15803d' }
]

// Standard sizes
const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const fetchProducts = async () => {
  loading.value = true
  error.value = null
  try {
    let url = '/products'
    const queryParams = new URLSearchParams()
    
    if (category.value !== 'all') {
      queryParams.append('category', category.value.charAt(0).toUpperCase() + category.value.slice(1))
    }
    if (subCategory.value !== 'all') {
      queryParams.append('subCategory', subCategory.value.charAt(0).toUpperCase() + subCategory.value.slice(1))
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }
    
    const response = await api.get(url)
    const data = response.data
    rawProducts.value = Array.isArray(data) ? data : (data.products || [])
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch products'
  } finally {
    loading.value = false
  }
}

// Synced query search param from navbar
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = String(route.query.q)
  }
  fetchProducts()
  categoryStore.fetchCategories()
  window.addEventListener('system:product_updated', fetchProducts)
})

onUnmounted(() => {
  window.removeEventListener('system:product_updated', fetchProducts)
})

watch(() => route.query.q, (newQ) => {
  if (newQ !== undefined) {
    searchQuery.value = String(newQ)
  }
})

watch(() => route.params, () => {
  fetchProducts()
}, { deep: true })

const navigateToCategory = (cat) => {
  if (cat === 'all') {
    router.push('/shop')
  } else {
    router.push(`/shop/${cat.toLowerCase()}`)
  }
}

const navigateToSubCategory = (subCat) => {
  if (category.value !== 'all') {
    router.push(`/shop/${category.value}/${subCat.toLowerCase()}`)
  } else {
    router.push(`/shop/all/${subCat.toLowerCase()}`)
  }
}

// Computed Filtered & Sorted Products
const filteredProducts = computed(() => {
  let list = [...rawProducts.value]

  // Filter out unpublished products
  list = list.filter(p => p.isPublished !== false)

  // 1. Text Search Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => {
      const name = (p.name || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || cat.includes(q)
    })
  }

  // 2. Price Range Filter
  if (selectedPriceRange.value !== 'all') {
    const range = priceRanges.find(r => r.id === selectedPriceRange.value)
    if (range) {
      list = list.filter(p => p.price >= range.min && p.price <= range.max)
    }
  }

  // 3. Color Filter
  if (selectedColor.value) {
    const cTarget = selectedColor.value.toLowerCase()
    list = list.filter(p => {
      // Check in colorVariants
      if (p.colorVariants && p.colorVariants.length > 0) {
        if (p.colorVariants.some(v => (v.color || '').toLowerCase() === cTarget)) return true
      }
      // Check in colors array
      if (p.colors && p.colors.length > 0) {
        if (p.colors.some(c => c.toLowerCase() === cTarget)) return true
      }
      return false
    })
  }

  // 4. Size Filter
  if (selectedSize.value) {
    const sTarget = selectedSize.value.toUpperCase()
    list = list.filter(p => {
      if (!p.sizes) return false
      return p.sizes.some(s => s.toUpperCase() === sTarget)
    })
  }

  // 5. In Stock Only
  if (onlyInStock.value) {
    list = list.filter(p => (p.stock !== undefined ? p.stock > 0 : true))
  }

  // 6. Rating Filter
  if (minRating.value > 0) {
    list = list.filter(p => (p.rating || 5) >= minRating.value)
  }

  // 7. Sorting
  if (sortBy.value === 'price-low') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price-high') {
    list.sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'rating') {
    list.sort((a, b) => (b.rating || 5) - (a.rating || 5))
  } else if (sortBy.value === 'newest') {
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return list
})

// Count active filters
const activeFilterCount = computed(() => {
  let count = 0
  if (category.value !== 'all') count++
  if (subCategory.value !== 'all') count++
  if (selectedPriceRange.value !== 'all') count++
  if (selectedColor.value) count++
  if (selectedSize.value) count++
  if (onlyInStock.value) count++
  if (minRating.value > 0) count++
  if (searchQuery.value.trim()) count++
  return count
})

const clearAllFilters = () => {
  selectedPriceRange.value = 'all'
  selectedColor.value = ''
  selectedSize.value = ''
  onlyInStock.value = false
  minRating.value = 0
  searchQuery.value = ''
  sortBy.value = 'featured'
  if (category.value !== 'all' || subCategory.value !== 'all') {
    router.push('/shop')
  }
}
</script>

<template>
  <div class="bg-slate-50/60 min-h-screen pb-20">
    
    <!-- Breadcrumbs -->
    <div class="bg-white border-b border-slate-100">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-base text-slate-500">
        <router-link to="/" class="hover:text-indigo-600 transition-colors">Home</router-link>
        <ChevronRight class="w-4 h-4 text-slate-400 mx-1" />
        <router-link to="/shop" class="hover:text-indigo-600 transition-colors">Shop</router-link>
        <template v-if="category !== 'all'">
          <ChevronRight class="w-4 h-4 text-slate-400 mx-1" />
          <span
            :class="{'text-slate-900 uppercase': subCategory === 'all', 'hover:text-indigo-600 cursor-pointer capitalize': subCategory !== 'all'}"
            @click="subCategory !== 'all' && navigateToCategory(category)"
          >
            {{ category }}
          </span>
        </template>
        <template v-if="subCategory !== 'all'">
          <ChevronRight class="w-4 h-4 text-slate-400 mx-1" />
          <span class="text-slate-900 uppercase">
            {{ subCategory }}
          </span>
        </template>
      </nav>
    </div>

    <!-- Top Hero / Banner Header -->
    <div class="bg-white border-b border-slate-200/80 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Category Title & Description -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
              <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
              <span>Catalog & Collections</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight capitalize">
              {{ category !== 'all' ? category : 'All Products' }}
              {{ subCategory !== 'all' ? `• ${subCategory}` : '' }}
            </h1>
            <p class="text-sm text-slate-500 mt-1 max-w-xl">
              Explore premium apparel and streetwear crafted for comfort, style, and everyday confidence.
            </p>
          </div>

          <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'Product' : 'Products' }} Available
            </span>
          </div>
        </div>

      </div>
    </div>

    <!-- Active Filters Strip (Chips) -->
    <div v-if="activeFilterCount > 0" class="bg-indigo-50/50 border-b border-indigo-100/60 py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-2 text-xs">
        <span class="font-bold text-indigo-900 mr-1 flex items-center gap-1">
          <SlidersHorizontal class="w-3.5 h-3.5" />
          Active Filters:
        </span>

        <!-- Category Chip -->
        <span v-if="category !== 'all'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          Category: {{ category }}
          <button @click="navigateToCategory('all')" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Search Chip -->
        <span v-if="searchQuery.trim()" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          Search: "{{ searchQuery }}"
          <button @click="searchQuery = ''" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Price Range Chip -->
        <span v-if="selectedPriceRange !== 'all'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          Price: {{ priceRanges.find(r => r.id === selectedPriceRange)?.label }}
          <button @click="selectedPriceRange = 'all'" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Color Chip -->
        <span v-if="selectedColor" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          Color: {{ selectedColor }}
          <button @click="selectedColor = ''" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Size Chip -->
        <span v-if="selectedSize" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          Size: {{ selectedSize }}
          <button @click="selectedSize = ''" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- In Stock Chip -->
        <span v-if="onlyInStock" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          In Stock Only
          <button @click="onlyInStock = false" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Rating Chip -->
        <span v-if="minRating > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 border border-indigo-200 font-semibold shadow-2xs">
          {{ minRating }}★ & Above
          <button @click="minRating = 0" class="hover:text-red-500 cursor-pointer"><X class="w-3 h-3" /></button>
        </span>

        <!-- Reset All Button -->
        <button
          @click="clearAllFilters"
          class="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 ml-2 cursor-pointer"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      
      <!-- Filter Toolbar Controls (Search, Sort, Mobile Filter, Grid) -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <!-- Left: Search within collection & Mobile Filter Trigger -->
        <div class="flex items-center gap-3 flex-1 max-w-md">
          <button
            @click="isMobileFilterOpen = true"
            class="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Filter class="w-4 h-4" />
            <span>Filters</span>
            <span v-if="activeFilterCount > 0" class="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
              {{ activeFilterCount }}
            </span>
          </button>

          <!-- Desktop Filter Toggle -->
          <button
            @click="isDesktopFilterOpen = !isDesktopFilterOpen"
            class="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Filter class="w-4 h-4" />
            <span>{{ isDesktopFilterOpen ? 'Hide Filters' : 'Show Filters' }}</span>
            <span v-if="activeFilterCount > 0 && !isDesktopFilterOpen" class="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
              {{ activeFilterCount }}
            </span>
          </button>

          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products in this collection..."
              class="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none transition"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Right: Sort & Grid View Toggle -->
        <div class="flex items-center justify-between sm:justify-end gap-3">
          
          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-semibold hidden md:inline">Sort by:</span>
            <select
              v-model="sortBy"
              class="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          <!-- Desktop Grid Density Toggle -->
          <div class="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              @click="gridCols = 3"
              :class="gridCols === 3 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
              class="p-1.5 rounded-lg transition cursor-pointer"
              title="3 Columns Grid"
            >
              <Grid3X3 class="w-4 h-4" />
            </button>
            <button
              @click="gridCols = 4"
              :class="gridCols === 4 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
              class="p-1.5 rounded-lg transition cursor-pointer"
              title="4 Columns Grid"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      <!-- Main Layout: Filters Sidebar + Product Grid -->
      <div class="flex flex-col lg:flex-row gap-8 items-start">
        
        <!-- Desktop Filters Sidebar (Sticky top-24) -->
        <transition name="filter-slide">
          <div v-show="isDesktopFilterOpen" class="hidden lg:block sticky top-24 self-start z-10">
            <aside class="w-72 flex-shrink-0 space-y-6">
              <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-7">
                
                <!-- Sidebar Header -->
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <Filter class="w-4 h-4 text-indigo-600" />
                    <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider">Filters</h2>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      v-if="activeFilterCount > 0"
                      @click="clearAllFilters"
                      class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      @click="isDesktopFilterOpen = false"
                      class="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Hide Filters"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>

            <!-- Categories Section -->
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Categories</h3>
              <div class="space-y-1">
                <button
                  @click="navigateToCategory('all')"
                  :class="category === 'all' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer"
                >
                  <span>All Categories</span>
                  <ChevronRight v-if="category === 'all'" class="w-3.5 h-3.5 text-indigo-600" />
                </button>

                <button
                  v-for="cat in categories"
                  :key="cat"
                  @click="navigateToCategory(cat)"
                  :class="category.toLowerCase() === cat.toLowerCase() ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'"
                  class="w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between capitalize cursor-pointer"
                >
                  <span>{{ cat }}</span>
                  <ChevronRight v-if="category.toLowerCase() === cat.toLowerCase()" class="w-3.5 h-3.5 text-indigo-600" />
                </button>
              </div>

              <!-- Subcategory pills if active -->
              <div v-if="subCategories.length > 0" class="mt-3 pt-3 border-t border-slate-100">
                <p class="text-[11px] font-bold text-slate-400 uppercase mb-2">Sub-Types</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="sub in subCategories"
                    :key="sub"
                    @click="navigateToSubCategory(sub)"
                    :class="subCategory.toLowerCase() === sub.toLowerCase() ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs transition capitalize cursor-pointer"
                  >
                    {{ sub }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Price Range Section -->
            <div class="pt-5 border-t border-slate-100">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Price Range</h3>
              <div class="space-y-1.5">
                <label
                  v-for="range in priceRanges"
                  :key="range.id"
                  class="flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition"
                  :class="selectedPriceRange === range.id ? 'bg-indigo-50/80 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'"
                >
                  <div class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="price-range"
                      :value="range.id"
                      v-model="selectedPriceRange"
                      class="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{{ range.label }}</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Color Swatches Section -->
            <div class="pt-5 border-t border-slate-100">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Color</h3>
                <button v-if="selectedColor" @click="selectedColor = ''" class="text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="col in availableColors"
                  :key="col.name"
                  type="button"
                  @click="selectedColor = (selectedColor === col.name ? '' : col.name)"
                  :title="col.name"
                  class="flex flex-col items-center gap-1 p-1.5 rounded-xl border transition cursor-pointer group"
                  :class="selectedColor === col.name ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' : 'border-slate-100 hover:border-slate-300'"
                >
                  <span
                    class="w-6 h-6 rounded-full border border-slate-300/80 shadow-2xs flex items-center justify-center transition-transform group-hover:scale-110"
                    :style="{ backgroundColor: col.hex }"
                  >
                    <Check v-if="selectedColor === col.name" class="w-3 h-3" :class="col.name === 'White' ? 'text-slate-900' : 'text-white'" />
                  </span>
                  <span class="text-[10px] font-medium text-slate-600 truncate max-w-full">{{ col.name }}</span>
                </button>
              </div>
            </div>

            <!-- Size Section -->
            <div class="pt-5 border-t border-slate-100">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Size</h3>
                <button v-if="selectedSize" @click="selectedSize = ''" class="text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="sz in availableSizes"
                  :key="sz"
                  type="button"
                  @click="selectedSize = (selectedSize === sz ? '' : sz)"
                  class="py-2 text-xs font-bold rounded-xl border transition cursor-pointer"
                  :class="selectedSize === sz ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
                >
                  {{ sz }}
                </button>
              </div>
            </div>

            <!-- In Stock Availability -->
            <div class="pt-5 border-t border-slate-100">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-xs font-bold text-slate-700">In Stock Items Only</span>
                <input
                  type="checkbox"
                  v-model="onlyInStock"
                  class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

              </div>
            </aside>
          </div>
        </transition>

        <!-- Product Grid Area (Preserving ProductCard.vue and ProductQuickViewModal.vue exactly!) -->
        <div class="flex-grow w-full">
          
          <!-- Loading State Skeletons -->
          <div v-if="loading" class="grid gap-3 sm:gap-6" :class="gridCols === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8'">
            <ProductSkeletonCard v-for="i in (gridCols === 4 ? 8 : 6)" :key="i" />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="bg-red-50 text-red-700 p-8 rounded-3xl border border-red-200 text-center">
            <p class="font-bold">{{ error }}</p>
            <button @click="fetchProducts" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
              Try Again
            </button>
          </div>

          <!-- Empty State (No Products Match Filter) -->
          <div
            v-else-if="filteredProducts.length === 0"
            class="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 shadow-xs"
          >
            <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <ShoppingBag class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-1">No products match your criteria</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              Try relaxing your filters, searching for something else, or resetting to browse all items.
            </p>
            <button
              @click="clearAllFilters"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>

          <!-- Products Grid (2 columns on mobile) -->
          <div
            v-else
            class="grid gap-3 sm:gap-6"
            :class="gridCols === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8'"
          >
            <!-- PRESERVING ProductCard.vue EXACTLY AS USER REQUESTED! -->
            <ProductCard
              v-for="prod in filteredProducts"
              :key="prod._id"
              :product="prod"
              @quick-view="handleQuickView"
            />
          </div>

        </div>

      </div>

    </div>

    <!-- Mobile Slide-over Filters Drawer -->
    <div
      v-if="isMobileFilterOpen"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
      @click="isMobileFilterOpen = false"
    ></div>

    <aside
      :class="[
        'fixed inset-y-0 right-0 z-50 w-80 bg-white text-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
        isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <div class="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base text-slate-900">
          <Filter class="w-4 h-4 text-indigo-600" />
          <span>Filter Products</span>
        </div>
        <button @click="isMobileFilterOpen = false" class="p-2 text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-grow space-y-6">
        <!-- Categories in Mobile -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Categories</h3>
          <div class="space-y-1">
            <button
              @click="navigateToCategory('all'); isMobileFilterOpen = false"
              :class="category === 'all' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600'"
              class="w-full text-left px-3 py-2 rounded-xl text-xs transition"
            >
              All Categories
            </button>
            <button
              v-for="cat in categories"
              :key="cat"
              @click="navigateToCategory(cat); isMobileFilterOpen = false"
              :class="category.toLowerCase() === cat.toLowerCase() ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600'"
              class="w-full text-left px-3 py-2 rounded-xl text-xs transition capitalize"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Price Range in Mobile -->
        <div class="pt-4 border-t border-slate-100">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Price Range</h3>
          <div class="space-y-2">
            <label
              v-for="range in priceRanges"
              :key="range.id"
              class="flex items-center gap-2 text-xs text-slate-700"
            >
              <input
                type="radio"
                name="mobile-price"
                :value="range.id"
                v-model="selectedPriceRange"
                class="text-indigo-600"
              />
              <span>{{ range.label }}</span>
            </label>
          </div>
        </div>

        <!-- Color in Mobile -->
        <div class="pt-4 border-t border-slate-100">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Color</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="col in availableColors"
              :key="col.name"
              @click="selectedColor = (selectedColor === col.name ? '' : col.name)"
              class="flex flex-col items-center gap-1 p-1 rounded-lg border text-[10px]"
              :class="selectedColor === col.name ? 'border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200'"
            >
              <span class="w-5 h-5 rounded-full border" :style="{ backgroundColor: col.hex }"></span>
              <span>{{ col.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 flex gap-3">
        <button
          @click="clearAllFilters(); isMobileFilterOpen = false"
          class="flex-1 py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
        >
          Reset
        </button>
        <button
          @click="isMobileFilterOpen = false"
          class="flex-1 py-2.5 text-center text-xs font-bold text-white bg-indigo-600 rounded-xl"
        >
          View Results
        </button>
      </div>
    </aside>

    <!-- PRESERVING ProductQuickViewModal.vue EXACTLY AS REQUESTED! -->
    <ProductQuickViewModal
      :is-open="isQuickViewOpen"
      :product="quickViewProduct"
      @close="closeQuickView"
    />

  </div>
</template>

<style scoped>
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  margin-right: -20rem; /* w-72 (18rem) + gap-8 (2rem) */
}
</style>
