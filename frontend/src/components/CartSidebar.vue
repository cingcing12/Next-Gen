<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'
import { useSystemStore } from '../stores/system'
import { X, Trash2, ShoppingBag } from 'lucide-vue-next'
import { useScrollLock } from '../composables/useScrollLock'

const cartStore = useCartStore()
const ui = useUIStore()
const systemStore = useSystemStore()

const freeShippingThreshold = computed(() => {
  const bannerText = systemStore.config?.announcementBanner || ''
  // Extract number after $ sign, e.g. "$10" -> 10
  const match = bannerText.match(/\$(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 100
})

useScrollLock(computed(() => cartStore.isOpen))

const handleUpdateQuantity = (index, newQty) => {
  const item = cartStore.items[index]
  if (item.maxStock !== undefined && newQty > item.maxStock) {
    ui.toast(`Only ${item.maxStock} available in stock.`, 'error')
    return
  }
  cartStore.updateQuantity(index, newQty)
}

const handleRemove = async (index) => {
  if (await ui.confirm('Remove Item', 'Are you sure you want to remove this item from your cart?', 'danger')) {
    cartStore.removeFromCart(index)
  }
}
</script>

<template>
  <div>
    <!-- Backdrop -->
    <transition name="fade">
      <div v-if="cartStore.isOpen" 
           @click="cartStore.toggleCart()" 
           @touchmove.prevent
           @wheel.prevent
           class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
      ></div>
    </transition>

    <!-- Sidebar -->
    <div :class="[
        'fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col',
        cartStore.isOpen ? 'translate-x-0' : 'translate-x-full'
      ]">
      
      <!-- Header -->
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 class="text-base sm:text-lg font-bold text-slate-900">Your Cart ({{ cartStore.totalItems }})</h2>
        <button @click="cartStore.toggleCart()" class="p-1.5 sm:p-2 -mr-1.5 sm:-mr-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
          <X class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-grow overflow-y-auto px-4 sm:px-6 py-4">
        <div v-if="cartStore.items.length === 0" class="h-full flex flex-col items-center justify-center text-center">
          <div class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <ShoppingBag class="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
          </div>
          <p class="text-xs sm:text-sm text-slate-500 font-medium">Your cart is empty.</p>
          <button @click="cartStore.toggleCart()" class="mt-3 sm:mt-4 text-xs sm:text-sm text-indigo-600 font-semibold hover:text-indigo-700">Continue Shopping</button>
        </div>

        <ul v-else class="space-y-4 sm:space-y-6">
          <li v-for="(item, index) in cartStore.items" :key="index" class="flex gap-3 sm:gap-4">
            <div class="w-16 h-20 sm:w-20 sm:h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900">{{ item.name }}</h3>
                <p class="text-[9px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                  <span v-if="item.size">Size: {{ item.size }}</span>
                  <span v-if="item.size && item.color && item.color.toLowerCase() !== 'default'"> | </span>
                  <span v-if="item.color && item.color.toLowerCase() !== 'default'">Color: {{ item.color }}</span>
                </p>
              </div>
              <div class="flex items-center justify-between mt-1 sm:mt-2">
                <div class="flex items-center border border-slate-200 rounded-md sm:rounded-lg">
                  <button @click="handleUpdateQuantity(index, item.qty - 1)" class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-l-md sm:rounded-l-lg transition-colors text-xs sm:text-sm">-</button>
                  <span class="px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-medium text-slate-900">{{ item.qty }}</span>
                  <button @click="handleUpdateQuantity(index, item.qty + 1)" class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-r-md sm:rounded-r-lg transition-colors text-xs sm:text-sm">+</button>
                </div>
                <div class="text-right">
                  <p class="text-xs sm:text-sm font-bold text-slate-900">${{ (item.price * item.qty).toFixed(2) }}</p>
                  <p v-if="item.qty > 1" class="text-[9px] sm:text-[10px] text-slate-400 font-medium">${{ item.price.toFixed(2) }} each</p>
                </div>
              </div>
            </div>
            <button @click="handleRemove(index)" class="self-start p-1 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div v-if="cartStore.items.length > 0" class="border-t border-slate-100 p-4 sm:p-6 bg-slate-50">
        <!-- Free Shipping Progress -->
        <div class="mb-4 bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
          <p class="text-[11px] sm:text-xs font-bold text-slate-700 mb-2">
            <span v-if="cartStore.totalPrice >= freeShippingThreshold">
              🎉 You've unlocked <span class="text-indigo-600">Free Shipping!</span>
            </span>
            <span v-else>
              You're <span class="text-indigo-600">${{ (freeShippingThreshold - cartStore.totalPrice).toFixed(2) }}</span> away from <span class="text-indigo-600">Free Shipping!</span>
            </span>
          </p>
          <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out relative"
              :style="{ width: `${Math.min((cartStore.totalPrice / freeShippingThreshold) * 100, 100)}%` }"
            >
              <!-- Optional shimmer effect for premium feel when full -->
              <div v-if="cartStore.totalPrice >= freeShippingThreshold" class="absolute inset-0 bg-white/30 -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mb-3 sm:mb-4">
          <span class="text-xs sm:text-sm font-medium text-slate-500">Subtotal</span>
          <span class="text-base sm:text-lg font-bold text-slate-900">${{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
        <p class="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Shipping and taxes calculated at checkout.</p>
        <router-link to="/checkout" @click="cartStore.toggleCart()" class="block text-center w-full bg-indigo-600 text-white text-xs sm:text-sm font-bold py-3 sm:py-3.5 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors">
          Proceed to Checkout
        </router-link>
      </div>

    </div>
  </div>
</template>
