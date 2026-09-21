<script setup>
import { onMounted } from 'vue'
import { Trash2, ShoppingCart, Heart, ArrowRight } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useUIStore } from '../stores/ui'
import WishlistCard from '../components/WishlistCard.vue'
import ProductSkeletonCard from '../components/ProductSkeletonCard.vue'

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const uiStore = useUIStore()

onMounted(() => {
  wishlistStore.fetchWishlist()
})

const removeFromWishlist = async (id) => {
  if (await uiStore.confirm('Remove Item', 'Are you sure you want to remove this item from your wishlist?', 'danger')) {
    wishlistStore.removeFromWishlist(id)
  }
}

const moveToCart = (item) => {
  cartStore.addToCart(item, 1, item.sizes?.[0] || 'M', item.colors?.[0] || 'Black')
  removeFromWishlist(item._id)
}
</script>

<template>
  <div class="bg-slate-50 min-h-screen py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">My Wishlist</h1>

      <div v-if="wishlistStore.loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ProductSkeletonCard v-for="i in 4" :key="i" />
      </div>
      
      <div v-else-if="wishlistStore.items.length === 0" class="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-slate-200/60 p-16 text-center max-w-3xl mx-auto flex flex-col items-center justify-center relative overflow-hidden group">
        <!-- Decorative Background Glow -->
        <div class="absolute -top-40 -left-40 w-80 h-80 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-700"></div>
        <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700"></div>

        <div class="relative z-10 w-24 h-24 bg-gradient-to-tr from-rose-50 to-indigo-50 border border-rose-100/50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
          <Heart class="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 class="relative z-10 text-3xl font-black text-slate-900 mb-4 tracking-tight">Your wishlist is empty</h2>
        <p class="relative z-10 text-slate-500 text-base max-w-md mx-auto mb-10 leading-relaxed">
          Looks like you haven't added any items to your wishlist yet. Discover the latest streetwear trends and save your favorites here.
        </p>
        <router-link
          to="/shop"
          class="relative z-10 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 transition-all duration-300 hover:-translate-y-1 active:scale-95"
        >
          <span>Explore Collection</span>
          <ArrowRight class="w-5 h-5" />
        </router-link>
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <WishlistCard 
          v-for="item in wishlistStore.items" 
          :key="item._id" 
          :item="item" 
          @remove="removeFromWishlist" 
        />
      </div>

    </div>
  </div>
</template>
