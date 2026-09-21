<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import NotificationDropdown from '../components/NotificationDropdown.vue'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Package,
  Tags,
  Menu,
  X,
  ExternalLink,
  Plus,
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  LayoutTemplate
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const isMobileSidebarOpen = ref(false)

const pageTitle = computed(() => {
  if (route.path === '/admin') return 'Dashboard Overview'
  if (route.path.startsWith('/admin/orders')) return 'Order Management'
  if (route.path.startsWith('/admin/products')) return 'Product Inventory'
  if (route.path.startsWith('/admin/categories')) return 'Category Management'
  if (route.path.startsWith('/admin/users')) return 'User & Customer Management'
  if (route.path.startsWith('/admin/shipping')) return 'Shipping Methods'
  if (route.path.startsWith('/admin/content')) return 'Content Manager'
  return 'Admin Console'
})

const navItems = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true }
    ]
  },
  {
    section: 'Store Management',
    items: [
      { name: 'Orders', path: '/admin/orders', icon: Package, exact: false },
      { name: 'Products', path: '/admin/products', icon: ShoppingBag, exact: false },
      { name: 'Categories', path: '/admin/categories', icon: Tags, exact: false },
      { name: 'Shipping', path: '/admin/shipping', icon: Truck, exact: false },
      { name: 'Content', path: '/admin/content', icon: LayoutTemplate, exact: false }
    ]
  },
  {
    section: 'System & Users',
    items: [
      { name: 'Users', path: '/admin/users', icon: Users, exact: false }
    ]
  }
]

const isRouteActive = (item) => {
  if (item.exact) {
    return route.path === item.path
  }
  return route.path.startsWith(item.path)
}

const logout = async () => {
  if (await uiStore.confirm('Logout', 'Are you sure you want to sign out?')) {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex text-slate-800">
    
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div
      v-if="isMobileSidebarOpen"
      class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- Sidebar (Always 100vh & Fixed) -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-72 h-screen h-dvh bg-slate-950 text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out md:translate-x-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Brand Logo Header -->
      <div class="h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/60">
        <router-link to="/admin" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-105 transition-all duration-300 border border-white/20">
            <svg viewBox="0 0 100 100" class="w-5 h-5 fill-current drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0 C53 38, 62 47, 100 50 C62 53, 53 62, 50 100 C47 62, 38 53, 0 50 C38 47, 47 38, 50 0 Z" />
            </svg>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 uppercase" style="font-family: 'Montserrat', sans-serif;">
                Next-Gen
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Admin
              </span>
            </div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-[11px] text-slate-400 font-medium leading-none">Control Center</span>
            </div>
          </div>
        </router-link>

        <!-- Close button on mobile -->
        <button
          @click="isMobileSidebarOpen = false"
          class="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Quick Store Visit Shortcut -->
      <div class="px-4 pt-4 pb-2 flex-shrink-0">
        <router-link
          to="/"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition group"
        >
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>View Live Storefront</span>
          </div>
          <ExternalLink class="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
        </router-link>
      </div>

      <!-- Navigation Menu (Scrollable inside 100vh if needed) -->
      <nav class="flex-grow py-3 px-3 space-y-6 overflow-y-auto">
        <div v-for="(group, gIdx) in navItems" :key="gIdx" class="space-y-1">
          <div class="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {{ group.section }}
          </div>
          
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="isMobileSidebarOpen = false"
            :class="[
              'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group',
              isRouteActive(item)
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            ]"
          >
            <div class="flex items-center gap-3">
              <component
                :is="item.icon"
                class="w-5 h-5 transition-transform group-hover:scale-110"
                :class="isRouteActive(item) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'"
              />
              <span>{{ item.name }}</span>
            </div>
            
            <ChevronRight
              v-if="isRouteActive(item)"
              class="w-4 h-4 text-indigo-200"
            />
          </router-link>
        </div>
      </nav>

      <!-- Bottom Admin User Profile Card -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 flex-shrink-0">
        <div class="bg-slate-900/90 rounded-2xl p-3 border border-slate-800/90 flex items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative flex-shrink-0">
              <img
                v-if="authStore.user?.image && !authStore.user.image.includes('via.placeholder')"
                :src="authStore.user.image"
                class="w-10 h-10 rounded-xl object-cover shadow-md border border-slate-700"
              />
              <div v-else class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md uppercase">
                {{ (authStore.user?.fullName || 'A').charAt(0) }}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-white truncate">
                {{ authStore.user?.fullName || 'Admin User' }}
              </p>
              <div class="flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                <ShieldCheck class="w-3 h-3" />
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="logout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Container (Offset by sidebar width on desktop) -->
    <div class="flex-grow flex flex-col min-w-0 md:pl-72 w-full min-h-screen">
      
      <!-- Top Sticky Navigation Bar -->
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        
        <!-- Left: Mobile Toggle & Page Title -->
        <div class="flex items-center gap-4">
          <button
            @click="isMobileSidebarOpen = true"
            class="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            <Menu class="w-5 h-5" />
          </button>

          <div>
            <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Admin</span>
              <span>/</span>
              <span class="text-indigo-600 font-semibold">{{ pageTitle }}</span>
            </div>
            <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {{ pageTitle }}
            </h1>
          </div>
        </div>

        <!-- Right: Action Buttons & Profile Info -->
        <div class="flex items-center gap-3">
          
          <!-- Add Product Quick Button -->
          <router-link
            to="/admin/products"
            class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-200 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Product</span>
          </router-link>

          <!-- Storefront Quick Link -->
          <router-link
            to="/"
            target="_blank"
            class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Storefront</span>
          </router-link>

          <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <!-- Notifications -->
          <NotificationDropdown />

          <!-- User Pill -->
          <div class="flex items-center gap-2.5 pl-1">
            <img
              v-if="authStore.user?.image && !authStore.user.image.includes('via.placeholder')"
              :src="authStore.user.image"
              class="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200"
            />
            <div v-else class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
              {{ (authStore.user?.fullName || 'A').charAt(0) }}
            </div>
            <div class="hidden lg:block text-left">
              <p class="text-xs font-bold text-slate-800 leading-tight">
                {{ authStore.user?.fullName || 'Admin User' }}
              </p>
              <p class="text-[10px] text-slate-400 font-medium">
                {{ authStore.user?.email || 'admin@nextgen.com' }}
              </p>
            </div>
          </div>

        </div>
      </header>

      <!-- Main Page Content Body -->
      <main class="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <router-view />
      </main>
    </div>

  </div>
</template>
