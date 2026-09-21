<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Plus, Edit2, Trash2, Search, X, ImagePlus, Loader2, 
  Package, Tag, DollarSign, Layers, Palette, Check, AlertCircle, Sparkles, UploadCloud,
  Image as ImageIcon, Eye, EyeOff, ChevronLeft, ChevronRight, List, LayoutGrid,
  BarChart3, Heart, ShoppingCart
} from 'lucide-vue-next'
import { useProductStore } from '../../stores/product'
import { useCategoryStore } from '../../stores/category'
import { useUIStore } from '../../stores/ui'
import api from '../../api/axios'

const productStore = useProductStore()
const categoryStore = useCategoryStore()
const ui = useUIStore()

const showModal = ref(false)
const showStatsModal = ref(false)
const selectedStatsProductId = ref(null)
const selectedStatsProduct = computed(() => productStore.products.find(p => p._id === selectedStatsProductId.value))
const analyticsDetails = ref({ cartUsers: [], wishlistUsers: [], boughtUsers: [] })
const isLoadingAnalytics = ref(false)
const expandedStat = ref(null)
const editingId = ref(null)
const searchQuery = ref('')
const selectedCategoryFilter = ref('all')
const isSaving = ref(false)

const viewMode = ref('list')
const currentPage = ref(1)
const itemsPerPage = ref(10)

onMounted(() => {
  productStore.fetchProducts()
  categoryStore.fetchCategories()
})

// Available size presets
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'Free Size']

// Preset colors palette
const PRESET_COLORS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#64748b' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Beige', hex: '#f5f5dc' },
  { name: 'Brown', hex: '#78350f' },
]

const form = ref({
  name: '',
  description: '',
  price: 0,
  discount: 0,
  category: 'Men',
  subCategory: '',
  colorVariants: [
    { color: 'Black', hex: '#0f172a', image: '', images: [], isUploading: false, sizeVariants: [], customSizeInput: '' }
  ],
  generalImages: []
})

const availableSubcategories = computed(() => {
  const selectedCat = categoryStore.categories.find(c => c.name === form.value.category)
  return selectedCat ? selectedCat.subcategories : []
})

// Filtered products for the table
const filteredProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchesSearch = !searchQuery.value || 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.colors && p.colors.some(c => c.toLowerCase().includes(searchQuery.value.toLowerCase())))

    const matchesCategory = selectedCategoryFilter.value === 'all' || 
      p.category?.toLowerCase() === selectedCategoryFilter.value.toLowerCase()

    return matchesSearch && matchesCategory
  })
})

watch([selectedCategoryFilter, searchQuery], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value) || 1)

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// Quick stats
const totalProducts = computed(() => productStore.products.length)
const totalInStock = computed(() => productStore.products.filter(p => p.stock > 0).length)
const totalLowStock = computed(() => productStore.products.filter(p => p.stock <= 5).length)

// Modal open/close
const openAddModal = () => {
  editingId.value = null
  const defaultSizes = ['M', 'L']
  form.value = {
    name: '',
    description: '',
    price: 0,
    discount: 0,
    category: categoryStore.categories[0]?.name || 'Men',
    subCategory: '',
    colorVariants: [
      { color: 'White', hex: '#ffffff', images: [], isUploading: false, customSizeInput: '', sizeVariants: defaultSizes.map(s => ({ size: s, stock: 0 })) },
      { color: 'Black', hex: '#0f172a', images: [], isUploading: false, customSizeInput: '', sizeVariants: defaultSizes.map(s => ({ size: s, stock: 0 })) }
    ],
    generalImages: []
  }
  showModal.value = true
}

const openEditModal = (product) => {
  editingId.value = product._id
  
  // Parse sizes
  const sizes = Array.isArray(product.sizes) ? product.sizes : (product.sizes ? product.sizes.split(',').map(s => s.trim()) : [])

  // Parse colorVariants
  let variants = []
  if (product.colorVariants && product.colorVariants.length > 0) {
    variants = product.colorVariants.map(v => {
      let varImgs = []
      if (Array.isArray(v.images) && v.images.length > 0) {
        varImgs = [...v.images]
      } else if (v.image) {
        varImgs = [v.image]
      }
      return {
        color: v.color,
        hex: getColorHex(v.color),
        images: varImgs,
        isUploading: false,
        sizeVariants: v.sizeVariants && v.sizeVariants.length > 0 
          ? [...v.sizeVariants] 
          : sizes.map(size => ({ size, stock: v.stock || 0 }))
      }
    })
  } else if (product.colors && product.colors.length > 0) {
    // Map legacy colors to variants
    const colorsList = Array.isArray(product.colors) ? product.colors : product.colors.split(',').map(c => c.trim())
    const prodImages = product.images || (product.image ? [product.image] : [])
    variants = colorsList.map((c, idx) => ({
      color: c,
      hex: getColorHex(c),
      images: prodImages[idx] ? [prodImages[idx]] : (prodImages[0] ? [prodImages[0]] : []),
      isUploading: false,
      sizeVariants: sizes.map(size => ({ size, stock: product.stock || 0 }))
    }))
  } else {
    variants = [{ 
      color: 'Black', 
      hex: '#0f172a', 
      images: [], 
      isUploading: false, 
      sizeVariants: sizes.map(size => ({ size, stock: product.stock || 0 })) 
    }]
  }

  // Ensure each variant has customSizeInput
  variants = variants.map(v => ({ ...v, customSizeInput: '' }))

  form.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    discount: product.discount || 0,
    category: product.category,
    subCategory: product.subCategory || '',
    colorVariants: variants,
    generalImages: product.images || []
  }
  showModal.value = true
}

const fetchAnalyticsDetails = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/analytics-details`)
    analyticsDetails.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const openStatsModal = async (product) => {
  selectedStatsProductId.value = product._id
  showStatsModal.value = true
  expandedStat.value = null
  isLoadingAnalytics.value = true
  await fetchAnalyticsDetails(product._id)
  isLoadingAnalytics.value = false
}

watch(() => selectedStatsProduct.value, async (newVal, oldVal) => {
  if (showStatsModal.value && newVal && oldVal && newVal._id === oldVal._id) {
    // If modal is open and the product's stats changed via SSE, silently refresh details
    await fetchAnalyticsDetails(newVal._id)
  }
}, { deep: true })

const toggleStatExpand = (stat) => {
  if (expandedStat.value === stat) expandedStat.value = null
  else expandedStat.value = stat
}

// Per-variant size management
const toggleVariantSize = (variant, size) => {
  if (!variant.sizeVariants) variant.sizeVariants = []
  const idx = variant.sizeVariants.findIndex(s => s.size === size)
  if (idx === -1) {
    variant.sizeVariants.push({ size, stock: 0 })
  } else {
    variant.sizeVariants.splice(idx, 1)
  }
}

const addVariantCustomSize = (variant) => {
  const trimmed = (variant.customSizeInput || '').trim().toUpperCase()
  if (trimmed && !variant.sizeVariants?.find(s => s.size === trimmed)) {
    if (!variant.sizeVariants) variant.sizeVariants = []
    variant.sizeVariants.push({ size: trimmed, stock: 0 })
    variant.customSizeInput = ''
  }
}

const removeVariantSize = (variant, sIdx) => {
  variant.sizeVariants.splice(sIdx, 1)
}

// Color variant management
const addColorVariant = () => {
  form.value.colorVariants.push({
    color: '',
    hex: '#64748b',
    images: [],
    isUploading: false,
    customSizeInput: '',
    sizeVariants: []
  })
}

const removeColorVariant = (index) => {
  form.value.colorVariants.splice(index, 1)
}

const selectPresetColor = (variant, preset) => {
  variant.color = preset.name
  variant.hex = preset.hex
}

// Upload bulk images specifically for a color variant
const uploadVariantImages = async (variant, event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  variant.isUploading = true
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i])
  }

  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.urls && res.data.urls.length > 0) {
      if (!variant.images) variant.images = []
      variant.images = [...variant.images, ...res.data.urls]
      ui.toast(`Uploaded ${res.data.urls.length} photos for ${variant.color || 'color'}!`, 'success')
    }
  } catch (err) {
    ui.toast('Failed to upload images', 'error')
  } finally {
    variant.isUploading = false
    event.target.value = ''
  }
}

const removeVariantImage = (variant, index) => {
  variant.images.splice(index, 1)
}

// Upload general images
const isUploadingGeneral = ref(false)
const generalFileInputRef = ref(null)

const uploadGeneralImages = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  isUploadingGeneral.value = true
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i])
  }

  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.value.generalImages = [...form.value.generalImages, ...res.data.urls]
    ui.toast('Gallery images uploaded', 'success')
  } catch (err) {
    ui.toast('Failed to upload gallery images', 'error')
  } finally {
    isUploadingGeneral.value = false
    if (generalFileInputRef.value) generalFileInputRef.value.value = ''
  }
}

const removeGeneralImage = (index) => {
  form.value.generalImages.splice(index, 1)
}

// Color hex helper
function getColorHex(colorName) {
  if (!colorName) return '#94a3b8'
  if (colorName.startsWith('#') || colorName.startsWith('rgb')) return colorName
  const match = PRESET_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase())
  return match ? match.hex : '#94a3b8'
}

// Save Product
const saveProduct = async () => {
  if (!form.value.name.trim()) {
    ui.toast('Product name is required', 'error')
    return
  }

  // Filter valid color variants and map to new sizeVariants schema
  const validVariants = form.value.colorVariants
    .filter(v => v.color.trim())
    .map(v => {
      const imgs = v.images || (v.image ? [v.image] : [])
      const sizeVariants = (v.sizeVariants || []).map(sv => ({
        size: sv.size,
        stock: Number(sv.stock) || 0
      }))
      return {
        color: v.color.trim(),
        image: imgs[0] || '',
        images: imgs,
        sizeVariants
      }
    })

  // Aggregate all images (all variant images first, then general images)
  const allVariantImages = validVariants.flatMap(v => v.images).filter(Boolean)
  const allImages = [...new Set([...allVariantImages, ...form.value.generalImages])]

  if (allImages.length === 0) {
    ui.toast('Please upload at least one image (for a color or in general gallery)', 'error')
    return
  }

  // Total stock = sum of all size stocks across all color variants
  const totalStock = validVariants.reduce((sum, v) => {
    return sum + v.sizeVariants.reduce((s2, sv) => s2 + (Number(sv.stock) || 0), 0)
  }, 0)

  // Aggregate all sizes across all color variants (unique)
  const allSizes = [...new Set(validVariants.flatMap(v => v.sizeVariants.map(sv => sv.size)))]

  const payload = {
    name: form.value.name,
    description: form.value.description,
    price: Number(form.value.price),
    discount: Number(form.value.discount || 0),
    stock: totalStock,
    category: form.value.category,
    subCategory: form.value.subCategory,
    sizes: allSizes,
    colors: validVariants.map(v => v.color),
    colorVariants: validVariants,
    images: allImages
  }

  isSaving.value = true
  try {
    if (editingId.value) {
      await productStore.updateProduct(editingId.value, payload)
      ui.toast('Product updated successfully!', 'success')
    } else {
      await productStore.createProduct(payload)
      ui.toast('Product created successfully!', 'success')
    }
    showModal.value = false
  } catch (error) {
    ui.toast(error.message || 'Failed to save product', 'error')
  } finally {
    isSaving.value = false
  }
}

const deleteProduct = async (id) => {
  if (await ui.confirm('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.', 'danger')) {
    try {
      await productStore.deleteProduct(id)
      ui.toast('Product deleted', 'success')
    } catch (error) {
      ui.toast(error || 'Failed to delete product', 'error')
    }
  }
}

const togglePublish = async (product) => {
  try {
    const newStatus = product.isPublished === false ? true : false
    await productStore.updateProduct(product._id, { isPublished: newStatus })
    ui.toast(`Product ${newStatus ? 'published' : 'unpublished'} successfully`, 'success')
  } catch (error) {
    ui.toast('Failed to update product visibility', 'error')
  }
}
</script>

<template>
  <div class="space-y-8">
    
    <!-- Top Bar with Header & Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Package class="w-8 h-8 text-indigo-600" />
          <span>Product Inventory</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1">Manage your catalog, stock, sizes, and color-specific images.</p>
      </div>

      <button
        @click="openAddModal"
        class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all"
      >
        <Plus class="w-5 h-5" />
        <span>Add New Product</span>
      </button>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Package class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-slate-400">Total Products</p>
          <p class="text-2xl font-black text-slate-900">{{ totalProducts }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Check class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-slate-400">In Stock</p>
          <p class="text-2xl font-black text-slate-900">{{ totalInStock }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase text-slate-400">Low / Out of Stock</p>
          <p class="text-2xl font-black text-slate-900">{{ totalLowStock }}</p>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      
      <!-- Filter Bar -->
      <div class="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="relative w-full md:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title, category, or color..."
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <select
            v-model="selectedCategoryFilter"
            class="py-2.5 px-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Categories</option>
            <option v-for="cat in categoryStore.categories" :key="cat._id" :value="cat.name">{{ cat.name }}</option>
          </select>
          <span class="text-xs text-slate-400 font-medium whitespace-nowrap">
            Showing {{ filteredProducts.length }} items
          </span>
          <!-- View Toggle -->
          <div class="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              @click="viewMode = 'list'"
              :class="viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
              class="p-1.5 rounded-lg transition cursor-pointer"
            >
              <List class="w-4 h-4" />
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
              class="p-1.5 rounded-lg transition cursor-pointer"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase font-bold tracking-wider text-slate-400 bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th class="py-4 px-6">Product</th>
              <th class="py-4 px-6">Category</th>
              <th class="py-4 px-6">Price</th>
              <th class="py-4 px-6">Colors & Variants</th>
              <th class="py-4 px-6">Stock Status</th>
              <th class="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-if="productStore.loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3.5">
                    <div class="w-14 h-14 rounded-2xl bg-slate-200"></div>
                    <div class="space-y-2">
                      <div class="h-4 bg-slate-200 rounded w-32"></div>
                      <div class="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6"><div class="h-6 bg-slate-200 rounded-full w-16"></div></td>
                <td class="py-4 px-6"><div class="h-4 bg-slate-200 rounded w-12"></div></td>
                <td class="py-4 px-6"><div class="h-5 bg-slate-200 rounded w-20"></div></td>
                <td class="py-4 px-6"><div class="h-6 bg-slate-200 rounded-full w-20"></div></td>
                <td class="py-4 px-6"><div class="h-8 bg-slate-200 rounded w-24 float-right"></div></td>
              </tr>
            </template>
            <tr v-else-if="filteredProducts.length === 0">
              <td colspan="6" class="py-12 text-center text-slate-400">
                <Package class="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No products found matching your search.
              </td>
            </tr>
            <tr
              v-else
              v-for="product in paginatedProducts"
              :key="product._id"
              class="hover:bg-slate-50/70 transition-colors group"
            >
              <!-- Thumbnail & Name -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3.5">
                  <div class="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                    <img
                      :src="product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'"
                      :alt="product.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {{ product.name }}
                      </h4>
                      <span v-if="product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)" class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-500 text-white shrink-0">New</span>
                    </div>
                    <p class="text-xs text-slate-400 line-clamp-1">
                      {{ product.sizes && product.sizes.length ? `Sizes: ${product.sizes.join(', ')}` : 'No sizes specified' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {{ product.category }}
                </span>
                <span v-if="product.subCategory" class="text-xs text-slate-400 block mt-0.5">
                  {{ product.subCategory }}
                </span>
              </td>

              <!-- Price -->
              <td class="py-4 px-6 font-bold text-slate-900">
                ${{ product.price?.toFixed(2) }}
              </td>

              <!-- Color Variants Preview -->
              <td class="py-4 px-6">
                <div v-if="product.colorVariants && product.colorVariants.length > 0" class="flex items-center gap-1.5 flex-wrap">
                  <div
                    v-for="cv in product.colorVariants"
                    :key="cv.color"
                    class="relative group/color"
                  >
                    <div
                      class="w-5 h-5 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                      :style="{ backgroundColor: getColorHex(cv.color) }"
                      :title="`${cv.color} ${cv.image ? '(has photo)' : ''}`"
                    ></div>
                    <!-- Mini hover thumbnail if variant has image -->
                    <div
                      v-if="cv.image"
                      class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/color:block z-30 bg-white p-1 rounded-lg shadow-xl border border-slate-200 w-16 h-16 pointer-events-none"
                    >
                      <img :src="cv.image" class="w-full h-full object-cover rounded" />
                    </div>
                  </div>
                  <span class="text-[11px] text-slate-400 font-medium ml-1">
                    ({{ product.colorVariants.length }} colors)
                  </span>
                </div>
                <div v-else-if="product.colors && product.colors.length > 0" class="flex items-center gap-1">
                  <div
                    v-for="c in product.colors"
                    :key="c"
                    class="w-4 h-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                    :style="{ backgroundColor: getColorHex(c) }"
                    :title="c"
                  ></div>
                </div>
                <span v-else class="text-xs text-slate-400">None</span>
              </td>

              <!-- Stock Status -->
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="product.stock > 10 ? 'bg-emerald-50 text-emerald-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'"
                >
                  {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="togglePublish(product)"
                    class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    :class="product.isPublished === false ? 'hover:bg-amber-50 hover:text-amber-600 text-slate-400' : 'hover:bg-emerald-50 hover:text-emerald-600 text-slate-600'"
                    :title="product.isPublished === false ? 'Publish Product' : 'Unpublish Product'"
                  >
                    <EyeOff v-if="product.isPublished === false" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                  <button
                    @click="openStatsModal(product)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Product Analytics"
                  >
                    <BarChart3 class="w-4 h-4" />
                  </button>
                  <button
                    @click="openEditModal(product)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteProduct(product._id)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grid View -->
      <div v-else class="p-6">
        <!-- Loading Skeletons for Grid -->
        <div v-if="productStore.loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="bg-slate-50 border border-slate-100 rounded-3xl p-4 animate-pulse">
            <div class="aspect-square bg-slate-200 rounded-2xl mb-4"></div>
            <div class="space-y-2">
              <div class="h-4 bg-slate-200 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2"></div>
              <div class="h-6 bg-slate-200 rounded-full w-1/3 mt-2"></div>
            </div>
          </div>
        </div>
        
        <!-- Empty state for Grid -->
        <div v-else-if="filteredProducts.length === 0" class="py-12 text-center text-slate-400">
          <Package class="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No products found matching your search.
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div v-for="product in paginatedProducts" :key="product._id" class="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all rounded-3xl overflow-hidden group flex flex-col">
            <!-- Image -->
            <div class="relative aspect-[4/5] bg-slate-100 overflow-hidden">
              <img :src="product.images?.[0] || 'https://via.placeholder.com/400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <!-- Status Badges overlay -->
              <div class="absolute top-3 right-3 flex flex-col gap-2 items-end">
                <span v-if="product.stock === 0" class="px-2.5 py-1 bg-rose-600/90 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm">Out of Stock</span>
                <span v-else-if="product.stock <= 5" class="px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm">Low Stock</span>
                <span v-if="product.isPublished === false" class="px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center gap-1"><EyeOff class="w-3 h-3"/> Hidden</span>
              </div>
            </div>
            
            <!-- Details -->
            <div class="p-5 flex-1 flex flex-col">
              <div class="flex items-start justify-between gap-3 mb-1">
                <h3 class="font-bold text-slate-900 text-sm line-clamp-1" :title="product.name">{{ product.name }}</h3>
                <span class="font-black text-indigo-600">${{ product.price?.toFixed(2) }}</span>
              </div>
              <p class="text-xs text-slate-400 mb-3 flex-1">{{ product.category }} {{ product.subCategory ? `› ${product.subCategory}` : '' }}</p>
              
              <!-- Colors -->
              <div v-if="product.colorVariants?.length" class="flex items-center gap-1 mb-4">
                <div v-for="cv in product.colorVariants.slice(0,5)" :key="cv.color" class="w-4 h-4 rounded-full ring-1 ring-slate-200 shadow-sm" :style="{ backgroundColor: getColorHex(cv.color) }" :title="cv.color"></div>
                <span v-if="product.colorVariants.length > 5" class="text-[10px] text-slate-400">+{{ product.colorVariants.length - 5 }}</span>
              </div>
              <div v-else-if="product.colors?.length" class="flex items-center gap-1 mb-4">
                <div v-for="c in product.colors.slice(0,5)" :key="c" class="w-4 h-4 rounded-full ring-1 ring-slate-200 shadow-sm" :style="{ backgroundColor: getColorHex(c) }" :title="c"></div>
                <span v-if="product.colors.length > 5" class="text-[10px] text-slate-400">+{{ product.colors.length - 5 }}</span>
              </div>
              <div v-else class="h-4 mb-4"></div>
              
              <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button @click="togglePublish(product)" class="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" :title="product.isPublished === false ? 'Publish' : 'Unpublish'">
                  <EyeOff v-if="product.isPublished === false" class="w-4 h-4 text-amber-500" />
                  <Eye v-else class="w-4 h-4" />
                </button>
                <div class="flex items-center gap-2">
                  <button @click="openStatsModal(product)" class="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl transition-colors cursor-pointer" title="Analytics">
                    <BarChart3 class="w-4 h-4" />
                  </button>
                  <button @click="openEditModal(product)" class="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <Edit2 class="w-3.5 h-3.5" /> Edit
                  </button>
                  <button @click="deleteProduct(product._id)" class="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
        <span class="text-xs text-slate-500 font-medium">
          Showing <span class="font-bold text-slate-900">{{ filteredProducts.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}</span> to <span class="font-bold text-slate-900">{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</span> of <span class="font-bold text-slate-900">{{ filteredProducts.length }}</span> items
        </span>
        <div class="flex items-center gap-1.5">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="w-8 h-8 rounded-lg flex items-center justify-center border transition"
            :class="currentPage === 1 ? 'border-transparent text-slate-300' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-1">
            <template v-for="page in totalPages" :key="page">
              <button
                v-if="Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages"
                @click="currentPage = page"
                class="min-w-[32px] h-8 rounded-lg text-xs font-bold transition flex items-center justify-center px-2 cursor-pointer"
                :class="currentPage === page ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'"
              >
                {{ page }}
              </button>
              <span v-else-if="Math.abs(page - currentPage) === 2 && page > 1 && page < totalPages" class="text-slate-400 px-1 text-xs">...</span>
            </template>
          </div>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="w-8 h-8 rounded-lg flex items-center justify-center border transition cursor-pointer"
            :class="currentPage === totalPages ? 'border-transparent text-slate-300' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ADD / EDIT PRODUCT MODAL (PREMIUM REDESIGN) -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" @click.self="showModal = false">
      <div class="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col" @click.stop>
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 class="text-xl font-bold text-slate-900">
              {{ editingId ? 'Edit Product' : 'Add New Product' }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Set product attributes, sizes, and specific photos for every color variant.
            </p>
          </div>
          <button
            @click="showModal = false"
            class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <form id="product-form" @submit.prevent="saveProduct" class="p-6 sm:p-8 overflow-y-auto space-y-7 flex-grow">
          
          <!-- Section 1: General Details -->
          <div class="space-y-4">
            <h3 class="text-xs uppercase font-bold tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Tag class="w-4 h-4" />
              <span>Basic Information</span>
            </h3>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Title *
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Classic Oversized Cotton Hoodie"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Description *
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                required
                placeholder="Describe fabric, fit, styling suggestions and details..."
                class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Price ($ USD) *
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                  <input
                    v-model="form.price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold transition-all"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Discount (%)
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-3 text-slate-400 font-bold">%</span>
                  <input
                    v-model="form.discount"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    class="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold transition-all"
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category *
                </label>
                <select
                  v-model="form.category"
                  @change="form.subCategory = ''"
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white font-medium"
                >
                  <option v-for="cat in categoryStore.categories" :key="cat._id" :value="cat.name">{{ cat.name }}</option>
                  <option v-if="categoryStore.categories.length === 0" value="Men">Men</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subcategory
                </label>
                <select
                  v-model="form.subCategory"
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white font-medium"
                >
                  <option value="">None (Standard)</option>
                  <option v-for="sub in availableSubcategories" :key="sub" :value="sub">{{ sub }}</option>
                </select>
              </div>
            </div>
          </div>



          <!-- Section 3: Color Variants with Specific Photos (THE REQUESTED FEATURE) -->
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs uppercase font-bold tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Palette class="w-4 h-4" />
                  <span>Color Variants & Color-Specific Images</span>
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  Upload separate photos for each color! The frontend will dynamically show the exact image when a customer picks that color.
                </p>
              </div>

              <button
                type="button"
                @click="addColorVariant"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
              >
                <Plus class="w-4 h-4" />
                <span>Add Color</span>
              </button>
            </div>

            <!-- List of Color Variant Cards -->
            <div class="space-y-3">
              <div
                v-for="(variant, vIdx) in form.colorVariants"
                :key="vIdx"
                class="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3.5 hover:border-indigo-200 transition-colors"
              >
                <!-- Top row: Color Indicator & Name & Presets & Upload Button & Delete -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 flex-1 w-full sm:w-auto">
                    <div
                      class="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300 flex-shrink-0"
                      :style="{ backgroundColor: variant.hex || getColorHex(variant.color) }"
                    ></div>
                    <input
                      v-model="variant.color"
                      type="text"
                      placeholder="Color name (e.g. Brown, Black, White)"
                      class="flex-1 max-w-xs rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold focus:border-indigo-500 outline-none bg-white shadow-xs"
                      required
                    />
                    
                    <!-- Quick Preset Dots -->
                    <div class="hidden sm:flex items-center gap-1.5 flex-wrap">
                      <span class="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                      <button
                        v-for="pColor in PRESET_COLORS"
                        :key="pColor.name"
                        type="button"
                        @click="selectPresetColor(variant, pColor)"
                        class="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-125 transition-transform"
                        :style="{ backgroundColor: pColor.hex }"
                        :title="pColor.name"
                      ></button>
                    </div>
                  </div>

                  <!-- Actions: Bulk Upload Button & Delete Variant -->
                  <div class="flex items-center gap-2 self-end sm:self-center">
                    <label class="cursor-pointer px-3.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs">
                      <Loader2 v-if="variant.isUploading" class="w-3.5 h-3.5 animate-spin" />
                      <UploadCloud v-else class="w-3.5 h-3.5" />
                      <span>{{ variant.isUploading ? 'Uploading...' : `+ Upload ${variant.color || 'Color'} Photos` }}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        class="hidden"
                        :disabled="variant.isUploading"
                        @change="uploadVariantImages(variant, $event)"
                      />
                    </label>

                    <button
                      v-if="form.colorVariants.length > 1"
                      type="button"
                      @click="removeColorVariant(vIdx)"
                      class="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors"
                      title="Remove this color"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Per-variant Sizes & Stock -->
                <div class="space-y-2 bg-white/60 p-3 rounded-xl border border-slate-200/60">
                  <div class="flex items-center gap-1.5 mb-1">
                    <Layers class="w-3.5 h-3.5 text-indigo-500" />
                    <span class="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Sizes & Stock for {{ variant.color || 'this color' }}</span>
                  </div>

                  <!-- Size Preset Toggle Buttons -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button
                      v-for="size in PRESET_SIZES"
                      :key="size"
                      type="button"
                      @click="toggleVariantSize(variant, size)"
                      :class="[
                        'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all',
                        variant.sizeVariants?.find(s => s.size === size)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                      ]"
                    >
                      {{ size }}
                    </button>

                    <!-- Custom size input -->
                    <div class="flex items-center gap-1 ml-1">
                      <input
                        v-model="variant.customSizeInput"
                        type="text"
                        placeholder="Custom..."
                        @keydown.enter.prevent="addVariantCustomSize(variant)"
                        class="w-24 rounded-lg border border-slate-200 px-2 py-1 text-[10px] focus:border-indigo-400 outline-none"
                      />
                      <button
                        type="button"
                        @click="addVariantCustomSize(variant)"
                        class="px-2 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
                      >+ Add</button>
                    </div>
                  </div>

                  <!-- Stock inputs per selected size -->
                  <div v-if="variant.sizeVariants && variant.sizeVariants.length > 0" class="flex flex-wrap gap-2 pt-1">
                    <div
                      v-for="(sv, sIdx) in variant.sizeVariants"
                      :key="sIdx"
                      class="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
                    >
                      <span class="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1.5 border-r border-slate-200 min-w-[28px] text-center">{{ sv.size }}</span>
                      <input
                        v-model.number="sv.stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-14 px-2 py-1.5 text-xs font-bold focus:bg-indigo-50 focus:text-indigo-700 outline-none text-center"
                      />
                      <button
                        type="button"
                        @click="removeVariantSize(variant, sIdx)"
                        class="px-1.5 py-1.5 text-slate-300 hover:text-rose-500 transition-colors text-xs border-l border-slate-100"
                        title="Remove size"
                      >×</button>
                    </div>
                  </div>
                  <div v-else class="text-[10px] text-slate-400 italic">
                    Click size buttons above to add sizes for this color.
                  </div>
                </div>

                <!-- Bottom row: Image Gallery Strip for this color -->
                <div class="pt-2 border-t border-slate-200/60">
                  <div v-if="variant.images && variant.images.length > 0" class="flex items-center gap-2.5 overflow-x-auto pb-1">
                    <div
                      v-for="(img, imgIdx) in variant.images"
                      :key="imgIdx"
                      class="w-16 h-16 rounded-xl border-2 border-slate-200 bg-white overflow-hidden relative group/vimg flex-shrink-0 shadow-xs"
                    >
                      <img :src="img" class="w-full h-full object-cover group-hover/vimg:scale-105 transition-transform" />
                      <!-- Cover badge on first image -->
                      <span v-if="imgIdx === 0" class="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white font-bold text-center py-0.5 pointer-events-none">
                        Cover
                      </span>
                      <!-- Remove image button -->
                      <button
                        type="button"
                        @click="removeVariantImage(variant, imgIdx)"
                        class="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover/vimg:opacity-100 transition-opacity shadow-sm hover:scale-110"
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>

                    <!-- Add more photos shortcut -->
                    <label class="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0 text-slate-400 hover:text-indigo-600">
                      <Plus class="w-5 h-5" />
                      <span class="text-[9px] font-bold mt-0.5">+ Add</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        class="hidden"
                        :disabled="variant.isUploading"
                        @change="uploadVariantImages(variant, $event)"
                      />
                    </label>

                    <span class="text-xs text-slate-500 font-medium ml-2 whitespace-nowrap">
                      {{ variant.images.length }} {{ variant.images.length === 1 ? 'photo' : 'photos' }}
                    </span>
                  </div>

                  <!-- Empty state for this color -->
                  <div v-else class="text-xs text-slate-400 italic flex items-center gap-1.5 py-1">
                    <ImagePlus class="w-4 h-4 text-slate-300" />
                    <span>No photos uploaded yet for {{ variant.color || 'this color' }}. Click "+ Upload Photos (Bulk)" above to select and upload multiple images at once!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Additional General Gallery Images -->
          <div class="space-y-3 pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs uppercase font-bold tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <ImagePlus class="w-4 h-4" />
                  <span>General Gallery Photos</span>
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Additional lookbook or angle shots for the product.</p>
              </div>

              <button
                type="button"
                @click="generalFileInputRef.click()"
                :disabled="isUploadingGeneral"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                <Loader2 v-if="isUploadingGeneral" class="w-3.5 h-3.5 animate-spin" />
                <Plus v-else class="w-3.5 h-3.5" />
                <span>Add Photos</span>
              </button>
              <input
                ref="generalFileInputRef"
                type="file"
                multiple
                accept="image/*"
                class="hidden"
                @change="uploadGeneralImages"
              />
            </div>

            <!-- Previews -->
            <div v-if="form.generalImages.length > 0" class="flex items-center gap-2 flex-wrap">
              <div
                v-for="(img, gIdx) in form.generalImages"
                :key="gIdx"
                class="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden relative group/img"
              >
                <img :src="img" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeGeneralImage(gIdx)"
                  class="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="showModal = false"
            class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="product-form"
            :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? 'Saving Product...' : (editingId ? 'Save Changes' : 'Create Product') }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- PRODUCT STATS MODAL -->
    <div v-if="showStatsModal && selectedStatsProduct" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" @click.self="showStatsModal = false">
      <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col" @click.stop>
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 class="w-5 h-5 text-indigo-600" />
              Product Analytics
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Live engagement and sales data for <span class="font-bold text-slate-700">{{ selectedStatsProduct.name }}</span>
            </p>
          </div>
          <button
            @click="showStatsModal = false"
            class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4">
          <!-- Stat 1: Added to Cart -->
          <div class="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden transition-all">
            <button @click="toggleStatExpand('cart')" class="w-full flex items-center justify-between p-5 hover:bg-indigo-50/50 transition-colors cursor-pointer focus:outline-none">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShoppingCart class="w-6 h-6" />
                </div>
                <div class="text-left">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Added to Cart</p>
                  <p class="text-[11px] text-slate-500 font-medium">Logged-in users who added to cart</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Loader2 v-if="isLoadingAnalytics" class="w-4 h-4 animate-spin text-slate-400" />
                <p class="text-3xl font-black text-slate-900">{{ selectedStatsProduct.cartCount || 0 }}</p>
              </div>
            </button>
            <div v-if="expandedStat === 'cart' && !isLoadingAnalytics" class="p-5 pt-0 border-t border-slate-100 mt-2 bg-white">
              <p v-if="analyticsDetails.cartUsers.length === 0" class="text-sm text-slate-400 text-center py-4 italic">No identified users (only guests).</p>
              <div v-else class="space-y-3 mt-3 max-h-48 overflow-y-auto">
                <div v-for="item in analyticsDetails.cartUsers" :key="item.user?._id" class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div class="flex items-center gap-3">
                    <img :src="item.user?.image || 'https://via.placeholder.com/40'" class="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                    <div>
                      <p class="text-sm font-bold text-slate-900 line-clamp-1">{{ item.user?.fullName || 'Unknown' }}</p>
                      <p class="text-xs text-slate-500">{{ item.user?.email }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Qty: {{ item.count }}</span>
                </div>
              </div>
              <div v-if="(selectedStatsProduct.cartCount || 0) > analyticsDetails.cartUsers.reduce((s, i) => s + i.count, 0)" class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 font-medium italic justify-center">
                <span>+ {{ (selectedStatsProduct.cartCount || 0) - analyticsDetails.cartUsers.reduce((s, i) => s + i.count, 0) }} anonymous/guest items</span>
              </div>
            </div>
          </div>

          <!-- Stat 2: Wishlist -->
          <div class="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden transition-all">
            <button @click="toggleStatExpand('wishlist')" class="w-full flex items-center justify-between p-5 hover:bg-rose-50/50 transition-colors cursor-pointer focus:outline-none">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart class="w-6 h-6" />
                </div>
                <div class="text-left">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-400">In Wishlists</p>
                  <p class="text-[11px] text-slate-500 font-medium">Users saved this product</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Loader2 v-if="isLoadingAnalytics" class="w-4 h-4 animate-spin text-slate-400" />
                <p class="text-3xl font-black text-slate-900">{{ selectedStatsProduct.wishlistCount || 0 }}</p>
              </div>
            </button>
            <div v-if="expandedStat === 'wishlist' && !isLoadingAnalytics" class="p-5 pt-0 border-t border-slate-100 mt-2 bg-white">
              <p v-if="analyticsDetails.wishlistUsers.length === 0" class="text-sm text-slate-400 text-center py-4 italic">No users have wishlisted this.</p>
              <div v-else class="space-y-3 mt-3 max-h-48 overflow-y-auto">
                <div v-for="user in analyticsDetails.wishlistUsers" :key="user._id" class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <img :src="user.image || 'https://via.placeholder.com/40'" class="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                  <div>
                    <p class="text-sm font-bold text-slate-900 line-clamp-1">{{ user.fullName }}</p>
                    <p class="text-xs text-slate-500">{{ user.email }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stat 3: Bought -->
          <div class="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden transition-all">
            <button @click="toggleStatExpand('bought')" class="w-full flex items-center justify-between p-5 hover:bg-emerald-50/50 transition-colors cursor-pointer focus:outline-none">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check class="w-6 h-6" />
                </div>
                <div class="text-left">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bought</p>
                  <p class="text-[11px] text-slate-500 font-medium">Items successfully ordered</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <Loader2 v-if="isLoadingAnalytics" class="w-4 h-4 animate-spin text-slate-400" />
                <p class="text-3xl font-black text-slate-900">{{ selectedStatsProduct.salesCount || 0 }}</p>
              </div>
            </button>
            <div v-if="expandedStat === 'bought' && !isLoadingAnalytics" class="p-5 pt-0 border-t border-slate-100 mt-2 bg-white">
              <p v-if="analyticsDetails.boughtUsers.length === 0" class="text-sm text-slate-400 text-center py-4 italic">No users have bought this yet.</p>
              <div v-else class="space-y-3 mt-3 max-h-48 overflow-y-auto">
                <div v-for="user in analyticsDetails.boughtUsers" :key="user._id" class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <img :src="user.image || 'https://via.placeholder.com/40'" class="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                  <div>
                    <p class="text-sm font-bold text-slate-900 line-clamp-1">{{ user.fullName }}</p>
                    <p class="text-xs text-slate-500">{{ user.email }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
