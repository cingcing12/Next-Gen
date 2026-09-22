<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSystemStore } from '../../stores/system'
import { useProductStore } from '../../stores/product'
import { useUIStore } from '../../stores/ui'
import api from '../../api/axios'
import { Plus, Trash2, Save, Image as ImageIcon, Search, X, UploadCloud, ChevronDown, ChevronUp } from 'lucide-vue-next'

const systemStore = useSystemStore()
const productStore = useProductStore()
const uiStore = useUIStore()

const localConfig = ref(null)
const isSaving = ref(false)

const searchQuery = ref('')
const isSearchingProducts = ref(false)

onMounted(async () => {
  if (!productStore.products.length) {
    productStore.fetchProducts()
  }
  await systemStore.fetchConfig()
  
  if (systemStore.config) {
    // Clone config for local editing
    localConfig.value = JSON.parse(JSON.stringify(systemStore.config))
    
    // Ensure aboutPage and values exist for older DB records
    if (!localConfig.value.aboutPage) {
      localConfig.value.aboutPage = {
        heroTitle: 'About Next-Gen',
        heroDescription: 'We believe that style is a way to say who you are without having to speak. Our mission is to provide premium, accessible fashion for both men and women, tailored for perfection.',
        heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000'
      }
    }
    if (!localConfig.value.aboutPage.values) {
      localConfig.value.aboutPage.valuesTitle = 'Why Shop With Us?'
      localConfig.value.aboutPage.valuesDescription = 'We are dedicated to providing the best shopping experience possible, focusing on quality, sustainability, and outstanding customer service.'
      localConfig.value.aboutPage.values = [
        { icon: 'Truck', title: 'Fast Delivery', description: 'Partnered with Vireak Buntham and J&T Express for rapid nationwide delivery.' },
        { icon: 'ShieldCheck', title: 'Secure Payments', description: '100% secure payments using Bakong KHQR, the national standard.' },
        { icon: 'RotateCcw', title: 'Easy Returns', description: 'Not happy? Return your items within 30 days for a full refund.' },
        { icon: 'HeartHandshake', title: 'Quality Support', description: 'Our team is available 24/7 to help you with any questions or issues.' }
      ]
    }
  }
})

// --- Image Upload ---
const isUploadingSlide = ref(null)
const isUploadingAbout = ref(false)
const isUploadingAboutPage = ref(false)

const handleSlideImageUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('images', file)

  isUploadingSlide.value = index
  try {
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.urls && data.urls.length > 0) {
      localConfig.value.homeSlider[index].image = data.urls[0]
      uiStore.toast('Image uploaded successfully', 'success')
    }
  } catch (error) {
    uiStore.toast('Failed to upload image', 'error')
  } finally {
    isUploadingSlide.value = null
  }
}

const handleAboutImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('images', file)

  isUploadingAbout.value = true
  try {
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.urls && data.urls.length > 0) {
      localConfig.value.aboutShop.image = data.urls[0]
      uiStore.toast('Image uploaded successfully', 'success')
    }
  } catch (error) {
    uiStore.toast('Failed to upload image', 'error')
  } finally {
    isUploadingAbout.value = false
  }
}

const handleAboutPageImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('images', file)

  isUploadingAboutPage.value = true
  try {
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.urls && data.urls.length > 0) {
      localConfig.value.aboutPage.heroImage = data.urls[0]
      uiStore.toast('Image uploaded successfully', 'success')
    }
  } catch (error) {
    uiStore.toast('Failed to upload image', 'error')
  } finally {
    isUploadingAboutPage.value = false
  }
}

// --- Slider ---
const addSlide = () => {
  localConfig.value.homeSlider.push({
    image: '',
    title: 'New Slide',
    highlight: 'Highlight',
    description: 'Description text goes here'
  })
}

const removeSlide = (index) => {
  localConfig.value.homeSlider.splice(index, 1)
}

const collapsedSlides = ref({})
const toggleSlide = (index) => {
  collapsedSlides.value[index] = !collapsedSlides.value[index]
}

const addValueCard = () => {
  localConfig.value.aboutPage.values.push({
    icon: 'Star',
    title: 'New Value',
    description: 'Description goes here'
  })
}

const removeValueCard = (index) => {
  localConfig.value.aboutPage.values.splice(index, 1)
}

const latestProductsPreview = computed(() => {
  const count = localConfig.value.featuredProductCount || 4
  return [...productStore.products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, count)
})

const getProductStock = (product) => {
  if (product.colorVariants && product.colorVariants.length > 0) {
    let total = 0
    product.colorVariants.forEach(cv => {
      if (cv.sizeVariants && cv.sizeVariants.length > 0) {
        cv.sizeVariants.forEach(sv => total += (sv.stock || 0))
      } else {
        total += (cv.stock || 0)
      }
    })
    return total
  }
  return product.stock || 0
}

const getProductColors = (product) => {
  if (product.colorVariants && product.colorVariants.length > 0) {
    return product.colorVariants.map(v => v.color)
  }
  return product.colors || []
}

const getColorHex = (colorName) => {
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

// --- Save ---
const saveConfig = async () => {
  isSaving.value = true
  try {
    const payload = {
      ...localConfig.value,
      ...localConfig.value
    }
    // Delete featuredProducts to avoid sending unnecessary array
    delete payload.featuredProducts
    await systemStore.updateConfig(payload)
    uiStore.toast('Content saved successfully!', 'success')
  } catch (err) {
    uiStore.toast('Failed to save content', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Content Manager</h1>
        <p class="text-sm text-slate-500 mt-1">Manage home page slider, featured products, and about section</p>
      </div>
      <button
        @click="saveConfig"
        :disabled="isSaving || !localConfig"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
      >
        <Save class="w-4 h-4" />
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

    <div v-if="systemStore.configLoading && !localConfig" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-slate-500 font-medium">Loading config...</p>
    </div>

    <div v-else-if="localConfig" class="space-y-8">
      
      <!-- HERO SLIDER SECTION -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Hero Slider</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage the rotating banners at the top of the home page</p>
          </div>
          <button @click="addSlide" class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-sm flex items-center gap-1.5 transition">
            <Plus class="w-3.5 h-3.5" /> Add Slide
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <div v-for="(slide, index) in localConfig.homeSlider" :key="index" class="relative p-5 bg-slate-50 rounded-2xl border border-slate-200 transition-all duration-200">
            
            <!-- Slide Header -->
            <div class="flex items-center justify-between" :class="{ 'mb-4': !collapsedSlides[index] }">
              <div 
                class="flex items-center gap-3 cursor-pointer select-none flex-1 group" 
                @click="toggleSlide(index)"
              >
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{{ index + 1 }}</span>
                <h3 class="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Slide Settings <span v-if="slide.title" class="text-slate-400 font-normal ml-1 truncate max-w-[200px] inline-block align-bottom">- {{ slide.title }}</span>
                </h3>
                <button class="p-1 rounded-md text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                  <ChevronDown v-if="collapsedSlides[index]" class="w-4 h-4" />
                  <ChevronUp v-else class="w-4 h-4" />
                </button>
              </div>
              
              <button @click.stop="removeSlide(index)" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition shadow-sm z-10 ml-4 shrink-0" title="Remove Slide">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Slide Body -->
            <div v-show="!collapsedSlides[index]" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Image</label>
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0 relative group">
                    <img v-if="slide.image" :src="slide.image" class="w-full h-full object-cover" />
                    <ImageIcon v-else class="w-6 h-6 text-slate-400 m-auto mt-4" />
                    
                    <label class="absolute inset-0 bg-black/50 text-white flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex">
                      <UploadCloud class="w-5 h-5 mb-0.5" />
                      <input type="file" class="hidden" accept="image/*" @change="e => handleSlideImageUpload(e, index)" />
                    </label>
                    
                    <div v-if="isUploadingSlide === index" class="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div class="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex-1">
                    <input v-model="slide.image" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Or paste image URL..." />
                    <p class="text-[10px] text-slate-500 mt-1 pl-1">Click the thumbnail to upload or paste a URL</p>
                  </div>
                </div>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Title</label>
                <input v-model="slide.title" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Highlight Text (Colored)</label>
                <input v-model="slide.highlight" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Description</label>
                <input v-model="slide.description" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </div>
          
          <div v-if="!localConfig.homeSlider.length" class="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            No slides added. Click "Add Slide" to create one.
          </div>
        </div>
      </section>

      <!-- FEATURED PRODUCTS -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-900">Featured Products</h2>
          <p class="text-xs text-slate-500 mt-0.5">Select how many of the latest products to showcase on the home page</p>
        </div>
        
        <div class="p-6">
          <div class="mb-6 max-w-sm">
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-2">Number of Latest Products to Show</label>
            <input 
              v-model.number="localConfig.featuredProductCount" 
              type="number" 
              min="1" max="12"
              class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
            />
          </div>
          
          <p class="text-xs font-bold text-slate-500 mb-4 uppercase">Preview of Latest Products</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="product in latestProductsPreview" :key="product._id" class="relative group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden aspect-[3/4]">
              <img :src="product.images?.[0] || product.image || 'https://via.placeholder.com/300'" class="w-full h-full object-cover" />
              
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16 flex flex-col gap-2">
                <div class="flex justify-between items-start gap-2">
                  <p class="text-white text-xs font-bold line-clamp-2 leading-tight flex-1">{{ product.name }}</p>
                  <span 
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap"
                    :class="getProductStock(product) > 0 ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'"
                  >
                    {{ getProductStock(product) > 0 ? `Stock: ${getProductStock(product)}` : 'Out of Stock' }}
                  </span>
                </div>
                
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span v-for="color in getProductColors(product).slice(0, 4)" :key="color" 
                        class="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
                        :style="{ backgroundColor: getColorHex(color) }"
                        :title="color"
                  ></span>
                  <span v-if="getProductColors(product).length > 4" class="text-[9px] text-white/70 font-medium">+{{ getProductColors(product).length - 4 }}</span>
                </div>
                
                <div class="flex items-center gap-1 flex-wrap mt-0.5">
                  <span v-for="size in (product.sizes || []).slice(0, 3)" :key="size" 
                        class="text-[8px] font-bold bg-white/20 text-white px-1 rounded-sm border border-white/20 uppercase">
                    {{ size }}
                  </span>
                  <span v-if="(product.sizes || []).length > 3" class="text-[9px] text-white/70 font-medium">+{{ (product.sizes || []).length - 3 }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="!latestProductsPreview.length" class="col-span-full border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center py-12 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
              No Products Found
            </div>
          </div>
        </div>
      </section>

      <!-- ANNOUNCEMENT BANNER SECTION -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-900">Announcement Banner</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage the text displayed in the top banner of the site</p>
        </div>
        
        <div class="p-6">
          <div class="space-y-1.5 max-w-2xl">
            <label class="text-[11px] font-bold uppercase text-slate-500">Banner Text</label>
            <input v-model="localConfig.announcementBanner" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" placeholder="e.g. Free shipping on orders over $100..." />
          </div>
        </div>
      </section>

      <!-- ABOUT SHOP SECTION -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-900">About Our Shop</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage the text and image for the bottom about section</p>
        </div>
        
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase text-slate-500">Title</label>
              <input v-model="localConfig.aboutShop.title" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase text-slate-500">Description</label>
              <textarea v-model="localConfig.aboutShop.description" rows="4" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition resize-none"></textarea>
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase text-slate-500">Image</label>
            <input v-model="localConfig.aboutShop.image" type="text" class="w-full px-3 py-2 mb-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" placeholder="Paste image URL or click to upload below..." />
            
            <div class="w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
              <img v-if="localConfig.aboutShop.image" :src="localConfig.aboutShop.image" class="w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400">
                <ImageIcon class="w-8 h-8 opacity-50" />
              </div>
              
              <label class="absolute inset-0 bg-black/50 text-white flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex">
                <UploadCloud class="w-8 h-8 mb-2" />
                <span class="font-bold text-sm">Upload Image</span>
                <input type="file" class="hidden" accept="image/*" @change="handleAboutImageUpload" />
              </label>
              
              <div v-if="isUploadingAbout" class="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div class="flex flex-col items-center">
                  <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                  <span class="text-sm font-bold text-indigo-600">Uploading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ABOUT PAGE SECTION -->
      <section class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-900">About Page Hero</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage the hero section on the dedicated About page</p>
        </div>
        
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase text-slate-500">Hero Title</label>
              <input v-model="localConfig.aboutPage.heroTitle" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase text-slate-500">Hero Description</label>
              <textarea v-model="localConfig.aboutPage.heroDescription" rows="4" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition resize-none"></textarea>
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase text-slate-500">Hero Background Image</label>
            <input v-model="localConfig.aboutPage.heroImage" type="text" class="w-full px-3 py-2 mb-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" placeholder="Paste image URL or click to upload below..." />
            
            <div class="w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
              <img v-if="localConfig.aboutPage.heroImage" :src="localConfig.aboutPage.heroImage" class="w-full h-full object-cover" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-slate-400">
                <ImageIcon class="w-8 h-8 opacity-50" />
              </div>
              
              <label class="absolute inset-0 bg-black/50 text-white flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex">
                <UploadCloud class="w-8 h-8 mb-2" />
                <span class="font-bold text-sm">Upload Image</span>
                <input type="file" class="hidden" accept="image/*" @change="handleAboutPageImageUpload" />
              </label>
              
              <div v-if="isUploadingAboutPage" class="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div class="flex flex-col items-center">
                  <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                  <span class="text-sm font-bold text-indigo-600">Uploading...</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-slate-800">Values Section</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Values Title</label>
                <input v-model="localConfig.aboutPage.valuesTitle" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold uppercase text-slate-500">Values Description</label>
                <input v-model="localConfig.aboutPage.valuesDescription" type="text" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition" />
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <h4 class="text-xs font-bold text-slate-500 uppercase">Value Cards</h4>
              <button @click="addValueCard" class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-sm flex items-center gap-1.5 transition">
                <Plus class="w-3.5 h-3.5" /> Add Card
              </button>
            </div>

            <div class="space-y-4">
              <div v-for="(card, index) in localConfig.aboutPage.values" :key="index" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative">
                <button @click="removeValueCard(index)" class="absolute top-4 right-4 w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-500 flex items-center justify-center transition shadow-sm">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold uppercase text-slate-500">Icon Name (Lucide)</label>
                    <input v-model="card.icon" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" placeholder="e.g. Truck, Star, Heart" />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold uppercase text-slate-500">Title</label>
                    <input v-model="card.title" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                  </div>
                  <div class="space-y-1.5 md:col-span-3">
                    <label class="text-[11px] font-bold uppercase text-slate-500">Description</label>
                    <input v-model="card.description" type="text" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
              <div v-if="!localConfig.aboutPage.values.length" class="text-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                No value cards added.
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  </div>
</template>
