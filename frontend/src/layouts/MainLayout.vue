<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  Heart,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Package,
  QrCode,
  Home,
  Store,
  Info,
  MessageSquare
} from 'lucide-vue-next'
import CartSidebar from '../components/CartSidebar.vue'
import NotificationDropdown from '../components/NotificationDropdown.vue'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useCategoryStore } from '../stores/category'
import { useWishlistStore } from '../stores/wishlist'
import { useUIStore } from '../stores/ui'
import { useSystemStore } from '../stores/system'
import { useScrollLock } from '../composables/useScrollLock'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const categoryStore = useCategoryStore()
const wishlistStore = useWishlistStore()
const uiStore = useUIStore()
const systemStore = useSystemStore()

const handleLogout = async () => {
  if (await uiStore.confirm('Logout', 'Are you sure you want to sign out?')) {
    authStore.logout()
  }
}

const isMobileNavOpen = ref(false)
const showSearchModal = ref(false)
const searchQuery = ref('')

useScrollLock(isMobileNavOpen)
useScrollLock(showSearchModal)

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/shop', query: { q: searchQuery.value.trim() } })
    showSearchModal.value = false
    searchQuery.value = ''
    isMobileNavOpen.value = false
  }
}

onMounted(() => {
  categoryStore.fetchCategories()
  if (authStore.isAuthenticated) {
    wishlistStore.fetchWishlist()
  }
  if (!systemStore.config) {
    systemStore.fetchConfig()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-clip print:overflow-visible">
    
    <!-- Top Micro Announcement Banner -->
    <div v-if="systemStore.config?.announcementBanner" class="bg-indigo-600 text-white text-[11px] font-medium py-2">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-between">
        <div class="text-center sm:text-left flex-1">
          {{ systemStore.config.announcementBanner }}
        </div>
        <div class="hidden sm:flex items-center gap-4">
          <router-link v-if="authStore.isAdmin" to="/admin" class="hover:text-indigo-200 transition-colors">
            Admin Console →
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-xs transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-18">
          
          <!-- Brand Logo -->
          <router-link to="/" class="flex-shrink-0 flex items-center gap-3 group focus:outline-none">
            <div class="flex flex-col">
              <span class="text-xl font-black text-slate-900 tracking-tight leading-none uppercase" style="font-family: 'Montserrat', sans-serif;">
                Next-Gen
              </span>
              <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5" style="font-family: 'Syncopate', sans-serif;">
                Streetwear
              </span>
            </div>
          </router-link>

          <!-- Desktop Navigation Menu -->
          <nav class="hidden lg:flex items-center gap-8">
            <!-- Home Link -->
            <router-link
              to="/"
              exact-active-class="text-indigo-600 font-bold after:scale-x-100"
              class="relative flex items-center gap-2 py-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <Home class="w-4 h-4" />
              <span>Home</span>
            </router-link>

            <!-- All Shop Link -->
            <router-link
              to="/shop"
              exact-active-class="text-indigo-600 font-bold after:scale-x-100"
              class="relative flex items-center gap-2 py-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <Store class="w-4 h-4" />
              <span>Shop</span>
            </router-link>

            <!-- About Link -->
            <router-link
              to="/about"
              active-class="text-indigo-600 font-bold after:scale-x-100"
              class="relative flex items-center gap-2 py-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <Info class="w-4 h-4" />
              <span>About</span>
            </router-link>

            <!-- Contact Link -->
            <router-link
              to="/contact"
              active-class="text-indigo-600 font-bold after:scale-x-100"
              class="relative flex items-center gap-2 py-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
            >
              <MessageSquare class="w-4 h-4" />
              <span>Contact</span>
            </router-link>
          </nav>

          <!-- Right Controls & User Hub -->
          <div class="flex items-center gap-4 sm:gap-5">
            
            <!-- Quick Search Button -->
            <button
              @click="showSearchModal = true"
              class="text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
              title="Search products"
            >
              <Search class="w-5 h-5" />
            </button>

            <!-- Wishlist Button with Badge -->
            <router-link
              to="/wishlist"
              class="relative text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none"
              title="Wishlist"
            >
              <Heart class="w-5 h-5" />
              <span
                v-if="wishlistStore.items && wishlistStore.items.length > 0"
                class="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
              >
                {{ wishlistStore.items.length }}
              </span>
            </router-link>

            <!-- Cart Trigger Button -->
            <button
              @click="cartStore.toggleCart()"
              class="relative text-slate-500 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag class="w-5 h-5" />
              <span
                v-if="cartStore.totalItems > 0"
                class="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
              >
                {{ cartStore.totalItems }}
              </span>
            </button>

            <!-- Notifications -->
            <NotificationDropdown v-if="authStore.isAuthenticated" />

            <div class="h-4 w-px bg-slate-300 hidden sm:block"></div>

            <!-- User Auth Profile Actions -->
            <div v-if="!authStore.isAuthenticated" class="hidden sm:flex items-center gap-2">
              <router-link
                to="/login"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer focus:outline-none"
              >
                <User class="w-3.5 h-3.5" />
                <span>Sign In</span>
              </router-link>
            </div>

            <div v-else class="hidden sm:flex items-center gap-4 sm:gap-5">
              <!-- Profile Link -->
              <router-link
                to="/profile"
                class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-[11px] uppercase transition-colors focus:outline-none overflow-hidden"
                title="My Account"
              >
                <img v-if="authStore.user?.image && !authStore.user.image.includes('via.placeholder')" :src="authStore.user.image" class="w-full h-full object-cover" />
                <span v-else>{{ (authStore.user?.fullName || 'U').charAt(0) }}</span>
              </router-link>

              <!-- Admin Link if Admin -->
              <router-link
                v-if="authStore.isAdmin"
                to="/admin"
                class="text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none"
                title="Admin Console"
              >
                <LayoutDashboard class="w-5 h-5" />
              </router-link>

              <!-- Logout Button -->
              <button
                @click="handleLogout"
                class="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none cursor-pointer"
                title="Logout"
              >
                <LogOut class="w-5 h-5" />
              </button>
            </div>

            <!-- Mobile Drawer Menu Button -->
            <button
              @click="isMobileNavOpen = true"
              class="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu class="w-6 h-6" />
            </button>

          </div>
          
        </div>
      </div>
    </header>

    <!-- Mobile Slide-over Drawer -->
    <div
      v-if="isMobileNavOpen"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
      @click="isMobileNavOpen = false"
      @touchmove.prevent
      @wheel.prevent
    ></div>

    <aside
      :class="[
        'fixed inset-y-0 right-0 z-50 w-80 bg-white text-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
        isMobileNavOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Mobile Drawer Header -->
      <div class="h-16 px-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <router-link to="/" @click="isMobileNavOpen = false" class="flex flex-col focus:outline-none">
          <span class="text-lg font-black text-slate-900 tracking-tight leading-none uppercase" style="font-family: 'Montserrat', sans-serif;">
            Next-Gen
          </span>
          <span class="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5" style="font-family: 'Syncopate', sans-serif;">
            Streetwear
          </span>
        </router-link>
        <button
          @click="isMobileNavOpen = false"
          class="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>



      <!-- Mobile Links List -->
      <div class="flex-grow py-4 px-3 space-y-4 overflow-y-auto hide-scrollbar">
        
        <div>
          <div class="px-3 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Navigation
          </div>
          <div class="flex flex-col space-y-1">
            <router-link
              to="/"
              @click="isMobileNavOpen = false"
              exact-active-class="!text-indigo-700 !font-bold bg-indigo-50/80"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Home class="w-4 h-4" />
              <span class="flex-grow">Home</span>
            </router-link>

            <router-link
              to="/shop"
              @click="isMobileNavOpen = false"
              active-class="!text-indigo-700 !font-bold bg-indigo-50/80"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Store class="w-4 h-4" />
              <span class="flex-grow">All Products</span>
            </router-link>
          </div>
        </div>

        <div>
          <div class="px-3 pt-2 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100">
            Information
          </div>
          <div class="flex flex-col space-y-1">
            <router-link
              to="/about"
              @click="isMobileNavOpen = false"
              active-class="!text-indigo-700 !font-bold bg-indigo-50/80"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Info class="w-4 h-4" />
              <span class="flex-grow">About Us</span>
            </router-link>

            <router-link
              to="/contact"
              @click="isMobileNavOpen = false"
              active-class="!text-indigo-700 !font-bold bg-indigo-50/80"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <MessageSquare class="w-4 h-4" />
              <span class="flex-grow">Contact</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Mobile User Footer -->
      <div class="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
        <div v-if="authStore.isAuthenticated">
          <div class="flex items-center gap-2.5 mb-3 px-1">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center uppercase overflow-hidden shrink-0 shadow-sm border border-slate-200">
              <img v-if="authStore.user?.image && !authStore.user.image.includes('via.placeholder')" :src="authStore.user.image" class="w-full h-full object-cover" />
              <span v-else class="text-xs sm:text-sm">{{ (authStore.user?.fullName || 'U').charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold text-slate-800 truncate">{{ authStore.user?.fullName }}</p>
              <p class="text-[10px] sm:text-xs text-slate-400 truncate">{{ authStore.user?.email }}</p>
            </div>
          </div>

          <div class="flex gap-2 mb-2">
            <router-link
              to="/profile"
              @click="isMobileNavOpen = false"
              class="flex-1 flex items-center justify-center py-2 text-[11px] font-bold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              My Profile
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/admin"
              @click="isMobileNavOpen = false"
              class="flex-1 flex items-center justify-center py-2 text-[11px] font-bold bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
            >
              Dashboard
            </router-link>
          </div>

          <button
            @click="handleLogout(); isMobileNavOpen = false"
            class="w-full py-2 flex items-center justify-center text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition cursor-pointer shadow-sm"
          >
            Sign Out
          </button>
        </div>

        <div v-else class="flex gap-2">
          <router-link
            to="/login"
            @click="isMobileNavOpen = false"
            class="flex-1 py-2 text-center text-[11px] font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition"
          >
            Sign In
          </router-link>
          <router-link
            to="/register"
            @click="isMobileNavOpen = false"
            class="flex-1 py-2 text-center text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
          >
            Register
          </router-link>
        </div>
      </div>
    </aside>

    <!-- Quick Search Modal -->
    <div
      v-if="showSearchModal"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      @click="showSearchModal = false"
      @touchmove.prevent
      @wheel.prevent
    >
      <div
        class="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 w-full max-w-xl"
        @click.stop
      >
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <h3 class="text-sm sm:text-base font-bold text-slate-900">Search Next-Gen Store</h3>
          <button @click="showSearchModal = false" class="text-slate-400 hover:text-slate-600 p-1">
            <X class="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSearch" class="relative">
          <Search class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            autofocus
            placeholder="Type clothing name, color, or style..."
            class="w-full pl-9 sm:pl-12 pr-20 sm:pr-24 py-2.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none"
          />
          <button
            type="submit"
            class="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div class="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400">
          <span>Popular:</span>
          <router-link
            to="/shop?q=t-shirt"
            @click="showSearchModal = false"
            class="px-2 sm:px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md sm:rounded-lg transition"
          >
            T-Shirt
          </router-link>
          <router-link
            to="/shop?q=jacket"
            @click="showSearchModal = false"
            class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
          >
            Jacket
          </router-link>
          <router-link
            to="/shop?q=pants"
            @click="showSearchModal = false"
            class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
          >
            Pants
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Page Content -->
    <main class="flex-grow">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 pt-10 sm:pt-20 pb-6 sm:pb-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Top Main Footer Area -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 pb-8 sm:pb-16">
          
          <!-- Brand Info -->
          <div class="md:col-span-12 lg:col-span-5 pr-0 lg:pr-8">
            <router-link to="/" class="flex items-center gap-3 group focus:outline-none inline-flex mb-4 sm:mb-6">
              <div class="flex flex-col">
                <span class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none uppercase" style="font-family: 'Montserrat', sans-serif;">
                  Next-Gen
                </span>
                <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5" style="font-family: 'Syncopate', sans-serif;">
                  Streetwear
                </span>
              </div>
            </router-link>
            <p class="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-6 sm:mb-8">
              Premium e-commerce platform for modern streetwear and everyday fashion. Redefining your style with instant Bakong KHQR checkout.
            </p>
            
            <!-- Contact Quick Links (Text-based minimal icons) -->
            <div class="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-slate-700">
              <a href="#" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
                 <span class="text-slate-400 group-hover:text-indigo-600 font-bold text-base sm:text-lg leading-none">f</span>
              </a>
              <a href="#" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
                 <span class="text-slate-400 group-hover:text-indigo-600 font-bold text-base sm:text-lg leading-none">ig</span>
              </a>
              <a href="#" class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
                 <span class="text-slate-400 group-hover:text-indigo-600 font-bold text-base sm:text-lg leading-none">x</span>
              </a>
            </div>
          </div>

          <!-- Quick Links: Shop -->
          <div class="md:col-span-4 lg:col-span-2">
            <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 sm:mb-6">Shop</h3>
            <ul class="space-y-3 sm:space-y-4">
              <li v-for="cat in categoryStore.categories.slice(0, 4)" :key="cat._id">
                <router-link :to="`/shop/${cat.name.toLowerCase()}`" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  {{ cat.name }}
                </router-link>
              </li>
              <li>
                <router-link to="/shop" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  All Products
                </router-link>
              </li>
            </ul>
          </div>

          <!-- Quick Links: Company -->
          <div class="md:col-span-4 lg:col-span-2">
            <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 sm:mb-6">Company</h3>
            <ul class="space-y-3 sm:space-y-4">
              <li>
                <router-link to="/about" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  About Us
                </router-link>
              </li>
              <li>
                <router-link to="/contact" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  Contact
                </router-link>
              </li>
              <li>
                <a href="#" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" class="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group">
                  <span class="w-0 h-px bg-indigo-600 transition-all group-hover:w-3"></span>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <!-- Support & Trust -->
          <div class="md:col-span-4 lg:col-span-3">
            <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 sm:mb-6">Support</h3>
            <div class="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 mb-4 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors">
               <p class="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Service</p>
               <a href="tel:+85512345678" class="text-base sm:text-lg font-black text-slate-900 hover:text-indigo-600 transition-colors block mb-3 sm:mb-4">+855 12 345 678</a>
               <p class="text-[11px] sm:text-xs font-medium text-slate-500 mb-3 sm:mb-4 leading-relaxed">Available 24/7 for support and order inquiries.</p>
               <router-link to="/contact" class="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group">
                  Contact Support <ChevronRight class="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </router-link>
            </div>
          </div>
          
        </div>

        <!-- Bottom Footer Bar -->
        <div class="pt-6 sm:pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-xs sm:text-sm font-medium text-slate-400 text-center sm:text-left">&copy; 2026 Next-Gen Streetwear. All rights reserved.</p>
          <div class="flex items-center justify-center gap-2 sm:gap-3">
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure Payments by</span>
            <span class="text-xs sm:text-sm font-black text-slate-800 tracking-tight">Bakong KHQR</span>
          </div>
        </div>

      </div>
    </footer>

    <!-- Cart Sidebar -->
    <CartSidebar />
  </div>
</template>
