<script setup>
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'
import { X, Trash2, ShoppingBag } from 'lucide-vue-next'

const cartStore = useCartStore()
const ui = useUIStore()

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
           class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
      ></div>
    </transition>

    <!-- Sidebar -->
    <div :class="[
        'fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col',
        cartStore.isOpen ? 'translate-x-0' : 'translate-x-full'
      ]">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <h2 class="text-lg font-bold text-slate-900">Your Cart ({{ cartStore.totalItems }})</h2>
        <button @click="cartStore.toggleCart()" class="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-grow overflow-y-auto px-6 py-4">
        <div v-if="cartStore.items.length === 0" class="h-full flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-slate-500 font-medium">Your cart is empty.</p>
          <button @click="cartStore.toggleCart()" class="mt-4 text-indigo-600 font-semibold hover:text-indigo-700">Continue Shopping</button>
        </div>

        <ul v-else class="space-y-6">
          <li v-for="(item, index) in cartStore.items" :key="index" class="flex gap-4">
            <div class="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-900">{{ item.name }}</h3>
                <p class="text-xs text-slate-500 mt-1">Size: {{ item.size || 'N/A' }} | Color: {{ item.color || 'N/A' }}</p>
              </div>
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center border border-slate-200 rounded-lg">
                  <button @click="handleUpdateQuantity(index, item.qty - 1)" class="px-2 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-l-lg transition-colors">-</button>
                  <span class="px-2 py-1 text-sm font-medium text-slate-900">{{ item.qty }}</span>
                  <button @click="handleUpdateQuantity(index, item.qty + 1)" class="px-2 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-r-lg transition-colors">+</button>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-900">${{ (item.price * item.qty).toFixed(2) }}</p>
                  <p v-if="item.qty > 1" class="text-[10px] text-slate-400 font-medium">${{ item.price.toFixed(2) }} each</p>
                </div>
              </div>
            </div>
            <button @click="handleRemove(index)" class="self-start p-1 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div v-if="cartStore.items.length > 0" class="border-t border-slate-100 p-6 bg-slate-50">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-medium text-slate-500">Subtotal</span>
          <span class="text-lg font-bold text-slate-900">${{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Shipping and taxes calculated at checkout.</p>
        <router-link to="/checkout" @click="cartStore.toggleCart()" class="block text-center w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors">
          Proceed to Checkout
        </router-link>
      </div>

    </div>
  </div>
</template>
