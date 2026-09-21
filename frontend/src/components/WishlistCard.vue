<script setup>
import { ref, computed } from 'vue'
import { Trash2, ShoppingCart, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['remove'])

const router = useRouter()
const cartStore = useCartStore()
const ui = useUIStore()

const displayColors = computed(() => {
  if (props.item.colorVariants && props.item.colorVariants.length > 0) {
    return props.item.colorVariants.map(v => v.color)
  }
  return props.item.colors || []
})

const selectedColor = ref(
  props.item.colorVariants?.[0]?.color || props.item.colors?.[0] || ''
)
const selectedSize = ref(props.item.sizes?.[0] || '')
const isMoving = ref(false)

const primaryImage = computed(() => {
  if (selectedColor.value && props.item.colorVariants && props.item.colorVariants.length > 0) {
    const variant = props.item.colorVariants.find(
      v => v.color.toLowerCase() === selectedColor.value.toLowerCase()
    )
    if (variant) {
      if (variant.images && variant.images.length > 0) return variant.images[0]
      if (variant.image) return variant.image
    }
  }

  if (props.item.images && props.item.images.length > 0) {
    return props.item.images[0]
  }
  return props.item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1480'
})

const inStock = computed(() => {
  return (props.item.countInStock ?? props.item.stock ?? 10) > 0
})

const confirmMoveToCart = () => {
  if (!inStock.value) return

  isMoving.value = true
  const sizeToUse = selectedSize.value || props.item.sizes?.[0] || null
  const colorToUse = selectedColor.value || props.item.colors?.[0] || null

  cartStore.addToCart(props.item, 1, sizeToUse, colorToUse)
  ui.toast(`Moved "${props.item.name}" to cart!`, 'success')
  
  setTimeout(() => {
    emit('remove', props.item._id)
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
  <div class="bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 border border-slate-100 hover:border-indigo-100 overflow-hidden flex flex-col group relative">
    
    <!-- Product Image (Navigates to detail, no quick-view modal) -->
    <router-link :to="`/product/${item._id}`" class="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden shrink-0 block">
      <img 
        :src="primaryImage" 
        :alt="item.name" 
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
      />
      <!-- Delete Button (Top Right) -->
      <button 
        @click.prevent="$emit('remove', item._id)" 
        class="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-md transition-all z-10 hover:scale-110 active:scale-95"
        title="Remove from Wishlist"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </router-link>

    <!-- Product Info (Card Body) -->
    <div class="p-5 flex flex-col flex-grow relative bg-white">
      
      <!-- Stock Status -->
      <div class="flex items-center justify-between mb-2">
        <span 
          class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          :class="inStock ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'"
        >
          {{ inStock ? 'In Stock' : 'Out of Stock' }}
        </span>
      </div>

      <router-link :to="`/product/${item._id}`" class="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 mb-3" :title="item.name">
        {{ item.name }}
      </router-link>
      
      <!-- Colors Swatches -->
      <div v-if="displayColors && displayColors.length > 0" class="mb-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Color:</span>
          <button
            v-for="color in displayColors"
            :key="color"
            type="button"
            @click.stop="selectedColor = color"
            :class="[
              'w-5 h-5 rounded-full border shadow-sm transition-all flex items-center justify-center',
              selectedColor.toLowerCase() === color.toLowerCase()
                ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110'
                : 'hover:scale-110 border-slate-200'
            ]"
            :style="{ backgroundColor: getColorStyle(color) }"
            :title="color"
          >
            <Check
              v-if="selectedColor.toLowerCase() === color.toLowerCase()"
              class="w-2.5 h-2.5"
              :class="color.toLowerCase() === 'white' || color.toLowerCase() === '#ffffff' ? 'text-slate-900' : 'text-white'"
            />
          </button>
        </div>
      </div>

      <!-- Sizes Pills -->
      <div v-if="item.sizes && item.sizes.length > 0" class="mb-4">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Size:</span>
          <button
            v-for="size in item.sizes"
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
      
      <!-- Bottom Row -->
      <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div class="flex flex-col">
          <span class="text-xs text-slate-400 font-medium">Price</span>
          <span class="text-xl font-black text-slate-900">${{ item.price?.toFixed(2) }}</span>
        </div>

        <button 
          @click="confirmMoveToCart" 
          :disabled="!inStock || isMoving"
          class="flex-1 max-w-[140px] py-2.5 px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          <ShoppingCart class="w-3.5 h-3.5 transition-transform group-hover/btn:-translate-y-0.5" /> 
          <span>{{ !inStock ? 'Out of Stock' : (isMoving ? 'Moving...' : 'Move to Cart') }}</span>
        </button>
      </div>

    </div>
  </div>
</template>
