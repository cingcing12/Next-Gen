<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import {
  User,
  Mail,
  Phone,
  Send,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Save,
  ShoppingBag,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Printer,
  X,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  Key,
  Edit3
} from 'lucide-vue-next'
import api from '../api/axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const ui = useUIStore()

// Active Tab ('profile', 'orders', 'security', 'address')
const activeTab = ref('orders') // default to orders or profile if user has orders

// Profile state
const profile = ref({
  fullName: '',
  email: '',
  phone: '',
  address: '',
  telegram: '',
  avatar: '',
  role: 'user',
  createdAt: null,
})

const is2FAEnabled = ref(false)
const loadingProfile = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const copiedOrderId = ref(null)

// Orders state
const orders = ref([])
const loadingOrders = ref(false)
const orderSearchQuery = ref('')
const orderStatusFilter = ref('all') // 'all', 'paid', 'unpaid', 'delivered', 'processing'
const orderYearFilter = ref('all')
const orderMonthFilter = ref('all')
const selectedOrder = ref(null)
const isReceiptModalOpen = ref(false)
const isTrackingModalOpen = ref(false)

// Fetch user profile
const fetchProfile = async () => {
  try {
    loadingProfile.value = true
    const response = await api.get('/users/profile')
    const data = response.data
    profile.value.fullName = data.fullName || ''
    profile.value.email = data.email || ''
    profile.value.phone = data.phone || ''
    profile.value.address = data.address || ''
    profile.value.telegram = data.telegramUsername || data.telegram || ''
    profile.value.avatar = data.image && !data.image.includes('via.placeholder') ? data.image : (authStore.user?.image || profile.value.avatar)
    profile.value.role = data.role || 'user'
    profile.value.createdAt = data.createdAt
    is2FAEnabled.value = !!data.twoFactorEnabled
  } catch (err) {
    ui.toast('Failed to load profile details', 'error')
  } finally {
    loadingProfile.value = false
  }
}

// Fetch user orders
const fetchOrders = async () => {
  try {
    loadingOrders.value = true
    const res = await api.get('/orders/myorders')
    orders.value = Array.isArray(res.data) ? res.data : []
    // If no orders yet, switch default tab to 'profile', otherwise keep 'orders'
    if (orders.value.length === 0 && !route.query.tab) {
      activeTab.value = 'profile'
    } else if (route.query.tab) {
      activeTab.value = route.query.tab
    }
  } catch (err) {
    console.error('Fetch Orders Error:', err)
  } finally {
    loadingOrders.value = false
  }
}

const handleUserUpdate = (e) => {
  const updatedUser = e.detail;
  if (authStore.user && updatedUser._id === authStore.user._id) {
    fetchProfile();
  }
}

onMounted(() => {
  if (route.query.tab) {
    activeTab.value = route.query.tab
  }
  fetchProfile()
  fetchOrders()

  // Listen for real-time order updates from Admin
  window.addEventListener('system:order_updated', fetchOrders)
  window.addEventListener('system:user_updated', handleUserUpdate)
})

onUnmounted(() => {
  window.removeEventListener('system:order_updated', fetchOrders)
  window.removeEventListener('system:user_updated', handleUserUpdate)
})

// Avatar upload
const uploadAvatar = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    ui.toast('Image size must be less than 2MB', 'error')
    return
  }

  isUploading.value = true
  const formData = new FormData()
  formData.append('images', file)

  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const newAvatar = res.data.urls[0]
    profile.value.avatar = newAvatar

    // Instantly save to profile
    await api.put('/users/profile', { image: newAvatar })
    if (authStore.user) {
      authStore.setCredentials({ ...authStore.user, image: newAvatar })
    }
    ui.toast('Profile avatar updated!', 'success')
  } catch (error) {
    ui.toast('Avatar upload failed. Please try again.', 'error')
  } finally {
    isUploading.value = false
  }
}

// Save profile info
const saveProfile = async () => {
  try {
    isSaving.value = true
    const updateData = {
      name: profile.value.fullName,
      phone: profile.value.phone,
      address: profile.value.address,
      telegram: profile.value.telegram,
      is2FAEnabled: is2FAEnabled.value,
      image: profile.value.avatar
    }
    const res = await api.put('/users/profile', updateData)
    if (authStore.user) {
      authStore.setCredentials({ ...authStore.user, ...res.data })
    }
    ui.toast('Profile details saved successfully!', 'success')
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    isSaving.value = false
  }
}

// Quick copy order ID
const copyOrderId = (id) => {
  navigator.clipboard.writeText(id)
  copiedOrderId.value = id
  ui.toast('Order ID copied to clipboard!', 'info')
  setTimeout(() => {
    if (copiedOrderId.value === id) copiedOrderId.value = null
  }, 2000)
}

// Computed stats
const totalSpent = computed(() => {
  return orders.value
    .reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0)
    .toFixed(2)
})

const completedOrdersCount = computed(() => {
  return orders.value.filter(o => o.isDelivered).length
})

const pendingOrdersCount = computed(() => {
  return orders.value.filter(o => !o.isDelivered).length
})

// Dynamic Date Filter Options
const availableYears = computed(() => {
  const years = new Set(orders.value.map(o => new Date(o.createdAt).getFullYear()))
  return Array.from(years).sort((a, b) => b - a)
})

const availableMonths = computed(() => {
  if (orderYearFilter.value === 'all') return []
  const months = new Set(
    orders.value
      .filter(o => new Date(o.createdAt).getFullYear() === parseInt(orderYearFilter.value))
      .map(o => new Date(o.createdAt).getMonth())
  )
  return Array.from(months).sort((a, b) => a - b)
})

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Filtered orders
const filteredOrders = computed(() => {
  let list = orders.value

  // Date filtering
  if (orderYearFilter.value !== 'all') {
    list = list.filter(o => new Date(o.createdAt).getFullYear() === parseInt(orderYearFilter.value))
  }
  
  if (orderMonthFilter.value !== 'all') {
    list = list.filter(o => new Date(o.createdAt).getMonth() === parseInt(orderMonthFilter.value))
  }

  // Status filtering
  if (orderStatusFilter.value === 'paid') {
    list = list.filter(o => o.isPaid)
  } else if (orderStatusFilter.value === 'unpaid') {
    list = list.filter(o => !o.isPaid)
  } else if (orderStatusFilter.value === 'delivered') {
    list = list.filter(o => o.isDelivered)
  } else if (orderStatusFilter.value === 'processing') {
    list = list.filter(o => !o.isDelivered)
  }

  // Search filtering
  if (orderSearchQuery.value.trim()) {
    const q = orderSearchQuery.value.toLowerCase().trim()
    list = list.filter(o => {
      const matchId = o._id.toLowerCase().includes(q)
      const matchItem = o.orderItems?.some(item => item.name.toLowerCase().includes(q))
      const matchCourier = o.deliveryCompany?.toLowerCase().includes(q)
      return matchId || matchItem || matchCourier
    })
  }

  return list
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 5

watch(filteredOrders, () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage))

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// Modals
const openReceiptModal = (order) => {
  selectedOrder.value = order
  isReceiptModalOpen.value = true
}

const openTrackingModal = (order) => {
  selectedOrder.value = order
  isTrackingModalOpen.value = true
}

const printReceipt = () => {
  const printArea = document.getElementById('invoice-printable-area');
  if (!printArea) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - Next-Gen</title>
        ${styleTags}
        <style>
          @page { size: letter portrait; margin: 0.5in; }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] pb-20 pt-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- ══ HERO PROFILE BANNER SKELETON ══ -->
      <div v-if="loadingProfile" class="bg-indigo-600 rounded-2xl overflow-hidden mb-8 shadow-md animate-pulse">
        <div class="p-5 sm:p-6 lg:p-8">
          <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 w-full">
            <!-- Left: Avatar & Info Skeleton -->
            <div class="flex flex-row items-center md:items-start gap-4 md:gap-6 w-full md:w-auto">
              <div class="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-indigo-500 shrink-0"></div>
              <div class="text-left flex-1 space-y-2 md:space-y-4 pt-1">
                <div class="w-32 md:w-48 h-6 md:h-8 bg-indigo-500 rounded"></div>
                <div class="flex flex-wrap items-center justify-start gap-2">
                  <div class="w-16 md:w-20 h-5 md:h-6 bg-indigo-500 rounded-md"></div>
                  <div class="w-24 md:w-40 h-5 md:h-6 bg-indigo-500 rounded-md"></div>
                </div>
                <div class="w-24 md:w-32 h-3 md:h-4 bg-indigo-500 rounded"></div>
              </div>
            </div>
            <!-- Stats Skeleton -->
            <div class="flex w-full md:w-auto justify-around md:justify-start gap-2 md:gap-3 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-indigo-500/30 md:border-0">
              <div class="flex-1 md:min-w-[100px] h-12 md:h-[110px] bg-indigo-500/50 rounded-lg"></div>
              <div class="flex-1 md:min-w-[100px] h-12 md:h-[110px] bg-indigo-500/50 rounded-lg"></div>
              <div class="flex-1 md:min-w-[100px] h-12 md:h-[110px] bg-indigo-500/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ HERO PROFILE BANNER ══ -->
      <div v-else class="bg-indigo-600 text-white rounded-2xl overflow-hidden mb-8 shadow-md">
        <div class="p-5 sm:p-6 lg:p-8">
          <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 w-full">
            
            <!-- Left: Identity -->
            <div class="flex flex-row items-center md:items-start gap-4 md:gap-6 w-full md:w-auto">
              <!-- Avatar -->
              <div class="relative group/avatar cursor-pointer shrink-0">
                <div class="w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-indigo-700 border-2 border-indigo-400/50 shadow-sm flex items-center justify-center relative transition-all duration-300">
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  alt="Profile Avatar"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white uppercase">
                  {{ profile.fullName ? profile.fullName.charAt(0) : 'U' }}
                </div>
                <!-- Uploading Spinner -->
                <div v-if="isUploading" class="absolute inset-0 bg-indigo-900/60 flex items-center justify-center">
                  <Loader2 class="w-6 h-6 text-white animate-spin" />
                </div>
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera class="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <input type="file" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" @change="uploadAvatar" accept="image/*" title="Change Profile Picture" />
              <!-- Online status dot -->
              <div class="absolute -bottom-1 -right-1 md:-bottom-1.5 md:-right-1.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-400 border-[3px] md:border-4 border-indigo-600 flex items-center justify-center"></div>
            </div>

            <!-- User Info -->
            <div class="text-left flex-1 space-y-1.5 md:space-y-3 pt-1">
              <div>
                <h1 class="text-xl md:text-3xl font-bold tracking-tight text-white mb-1.5 md:mb-2.5">
                  {{ profile.fullName || 'Customer Profile' }}
                </h1>
                <div class="flex flex-wrap items-center justify-start gap-2">
                  <span
                    v-if="profile.role === 'admin'"
                    class="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest bg-yellow-400 text-black shadow-sm"
                  >
                    <Sparkles class="w-3 h-3 md:w-3.5 md:h-3.5" /> Admin
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm shadow-sm"
                  >
                    Member
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-medium bg-indigo-700/50 text-indigo-100 border border-indigo-400/30 backdrop-blur-sm">
                    <Mail class="w-3 h-3 md:w-3.5 md:h-3.5" /> {{ profile.email || 'loading...' }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-start gap-2 md:gap-3 text-[10px] md:text-sm font-medium text-indigo-200">
                <span class="flex items-center gap-1 md:gap-1.5">
                  <Calendar class="w-3 h-3 md:w-4 md:h-4" />
                  Joined {{ profile.createdAt ? new Date(profile.createdAt).getFullYear() : '2026' }}
                </span>
                <span class="w-1 h-1 rounded-full bg-indigo-400 hidden md:block"></span>
                <span class="flex items-center gap-1 md:gap-1.5" :class="is2FAEnabled ? 'text-emerald-300' : 'text-amber-300'">
                  <ShieldCheck v-if="is2FAEnabled" class="w-3 h-3 md:w-4 md:h-4" />
                  <ShieldAlert v-else class="w-3 h-3 md:w-4 md:h-4" />
                  2FA {{ is2FAEnabled ? 'Secured' : 'Inactive' }}
                </span>
              </div>
            </div>
            </div> <!-- End Left -->

            <!-- Right: Stat Cards (Minimal on mobile) -->
            <div class="flex w-full md:w-auto justify-around md:justify-start gap-2 md:gap-3 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-indigo-500/30 md:border-0">
              
              <div class="flex flex-col items-center justify-center md:bg-indigo-700/40 md:border border-indigo-400/20 rounded-xl px-2 py-1 md:p-4 md:min-w-[100px]">
                <div class="hidden md:flex w-10 h-10 mx-auto bg-indigo-600 border border-indigo-400/30 rounded-lg items-center justify-center mb-2 shadow-sm">
                  <ShoppingBag class="w-5 h-5 text-white" />
                </div>
                <p class="text-lg md:text-2xl font-bold text-white leading-none">{{ orders.length }}</p>
                <p class="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-indigo-200 mt-1 md:mt-1.5">Orders</p>
              </div>

              <div class="flex flex-col items-center justify-center md:bg-indigo-700/40 md:border border-indigo-400/20 rounded-xl px-2 py-1 md:p-4 md:min-w-[100px] border-l border-indigo-500/30 md:border-l-0">
                <div class="hidden md:flex w-10 h-10 mx-auto bg-indigo-600 border border-indigo-400/30 rounded-lg items-center justify-center mb-2 shadow-sm">
                  <span class="font-bold text-white text-lg">$</span>
                </div>
                <p class="text-lg md:text-2xl font-bold text-white leading-none">${{ totalSpent }}</p>
                <p class="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-indigo-200 mt-1 md:mt-1.5">Spent</p>
              </div>

              <div class="flex flex-col items-center justify-center md:bg-indigo-700/40 md:border border-indigo-400/20 rounded-xl px-2 py-1 md:p-4 md:min-w-[100px] border-l border-indigo-500/30 md:border-l-0">
                <div class="hidden md:flex w-10 h-10 mx-auto bg-indigo-600 border border-indigo-400/30 rounded-lg items-center justify-center mb-2 shadow-sm">
                  <Package class="w-5 h-5 text-white" />
                </div>
                <p class="text-lg md:text-2xl font-bold text-white leading-none">{{ completedOrdersCount }}</p>
                <p class="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-indigo-200 mt-1 md:mt-1.5">Delivered</p>
              </div>

            </div>

          </div>
        </div>
      </div><!-- end hero -->

      <!-- TAB NAVIGATION (Classic Underline Style) -->
      <div class="flex items-center gap-6 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar px-2">
        <button
          @click="activeTab = 'orders'"
          class="relative flex items-center gap-2 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
          :class="activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'"
        >
          <ShoppingBag class="w-4 h-4" />
          <span>Order History</span>
          <span
            v-if="orders.length > 0"
            class="ml-1 px-2 py-0.5 text-xs rounded-full font-bold"
            :class="activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'"
          >
            {{ orders.length }}
          </span>
        </button>

        <button
          @click="activeTab = 'profile'"
          class="relative flex items-center gap-2 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
          :class="activeTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'"
        >
          <User class="w-4 h-4" />
          <span>Personal Info</span>
        </button>

        <button
          @click="activeTab = 'security'"
          class="relative flex items-center gap-2 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
          :class="activeTab === 'security' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'"
        >
          <Shield class="w-4 h-4" />
          <span>Security</span>
        </button>

        <button
          @click="activeTab = 'address'"
          class="relative flex items-center gap-2 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
          :class="activeTab === 'address' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'"
        >
          <MapPin class="w-4 h-4" />
          <span>Address</span>
        </button>
      </div>

      <!-- TAB 1: ORDER HISTORY -->
      <transition name="fade" mode="out-in">
      <div v-if="activeTab === 'orders'" class="space-y-6" key="orders">
        
        <!-- Controls Bar: Filter Chips & Search -->
        <div class="bg-white rounded-xl p-4 border border-gray-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <!-- Filter chips -->
          <div class="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              @click="orderStatusFilter = 'all'"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border',
                orderStatusFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              ]"
            >
              All ({{ orders.length }})
            </button>
            <button
              @click="orderStatusFilter = 'paid'"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border',
                orderStatusFilter === 'paid'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              ]"
            >
              <div v-if="orderStatusFilter === 'paid'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
              Paid
            </button>
            <button
              @click="orderStatusFilter = 'unpaid'"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border',
                orderStatusFilter === 'unpaid'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              ]"
            >
              <div v-if="orderStatusFilter === 'unpaid'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
              Pending Pay
            </button>
            <button
              @click="orderStatusFilter = 'processing'"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border',
                orderStatusFilter === 'processing'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              ]"
            >
              <div v-if="orderStatusFilter === 'processing'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
              In Transit ({{ pendingOrdersCount }})
            </button>
            <button
              @click="orderStatusFilter = 'delivered'"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border',
                orderStatusFilter === 'delivered'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              ]"
            >
              <Check v-if="orderStatusFilter === 'delivered'" class="w-3.5 h-3.5" />
              Delivered ({{ completedOrdersCount }})
            </button>
          </div>

          <!-- Date filters (Dynamic) -->
          <div class="flex items-center gap-3 hidden md:flex">
            <select
              v-model="orderYearFilter"
              @change="orderMonthFilter = 'all'"
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer appearance-none pr-8 relative"
              style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.7rem top 50%; background-size: 0.65rem auto;"
            >
              <option value="all">Any Year</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>

            <select
              v-if="orderYearFilter !== 'all' && availableMonths.length > 0"
              v-model="orderMonthFilter"
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer appearance-none pr-8 relative"
              style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.7rem top 50%; background-size: 0.65rem auto;"
            >
              <option value="all">Any Month</option>
              <option v-for="monthIndex in availableMonths" :key="monthIndex" :value="monthIndex">
                {{ monthNames[monthIndex] }}
              </option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative min-w-[200px] lg:max-w-xs w-full flex-1 md:flex-none">
            <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="orderSearchQuery"
              type="text"
              placeholder="Search by ID, item, or courier..."
              class="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-300 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        <!-- Skeleton Loading state -->
        <div v-if="loadingOrders" class="space-y-6">
          <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
            <!-- Minimal Header Skeleton -->
            <div class="px-4 md:px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>
                <div class="space-y-2">
                  <div class="w-24 h-4 bg-slate-100 rounded"></div>
                  <div class="w-32 h-3 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-16 h-4 bg-slate-100 rounded"></div>
                <div class="w-16 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
            <!-- Minimal Body Skeleton -->
            <div class="px-4 md:px-6 py-2">
              <div class="flex items-center gap-3 md:gap-4 py-2">
                <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-100 shrink-0"></div>
                <div class="flex-1 space-y-2.5">
                  <div class="w-1/3 h-4 bg-slate-100 rounded"></div>
                  <div class="w-1/4 h-3 bg-slate-100 rounded"></div>
                </div>
                <div class="w-12 h-5 bg-slate-100 rounded"></div>
              </div>
            </div>
            <!-- Minimal Footer Skeleton -->
            <div class="px-4 md:px-6 py-4 mt-2 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 border-t border-slate-100">
              <div class="w-1/2 h-8 bg-slate-100 rounded"></div>
              <div class="w-full md:w-1/3 h-10 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>

        <!-- Empty State (No orders) -->
        <div
          v-else-if="filteredOrders.length === 0"
          class="bg-white rounded-xl p-16 text-center border border-gray-200 max-w-3xl mx-auto"
        >
          <div class="w-20 h-20 bg-gray-50 border border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package class="w-10 h-10 stroke-[1.5]" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ orders.length === 0 ? "You haven't ordered yet" : 'No orders found' }}
          </h3>
          <p class="text-gray-500 text-sm max-w-md mx-auto mb-8">
            {{ orders.length === 0
              ? "Your order history is empty. Discover the latest trends in our shop and grab something awesome today!"
              : "We couldn't find any orders matching your current search or filters. Try adjusting them." }}
          </p>
          <router-link
            v-if="orders.length === 0"
            to="/shop"
            class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            <ShoppingBag class="w-4 h-4" />
            <span>Explore Collection</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>
          <button
            v-else
            @click="orderStatusFilter = 'all'; orderSearchQuery = ''"
            class="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>

        <!-- Orders List -->
        <div v-else class="space-y-6">
          <div
            v-for="order in paginatedOrders"
            :key="order._id"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <!-- Minimal Order Card Header -->
            <div class="px-4 md:px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- Order ID and Date -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <ShoppingBag class="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-mono text-sm font-bold text-slate-900 tracking-tight">
                      #{{ order._id.slice(-8).toUpperCase() }}
                    </span>
                    <button
                      @click="copyOrderId(order._id)"
                      title="Copy full Order ID"
                      class="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Check v-if="copiedOrderId === order._id" class="w-3.5 h-3.5 text-emerald-500" />
                      <Copy v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span class="text-xs text-slate-500 flex items-center gap-1"><Clock class="w-3 h-3"/> {{ formatDate(order.createdAt) }}</span>
                </div>
              </div>
              
              <!-- Badges - minimal dots -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <span class="text-[10px] md:text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Truck class="w-3.5 h-3.5" /> {{ order.deliveryCompany || 'Standard' }}
                </span>
                <span class="w-1 h-1 rounded-full bg-slate-200 hidden sm:block"></span>
                <span v-if="order.isPaid" class="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Paid
                </span>
                <span v-else class="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Pending
                </span>
                
                <span v-if="order.isDelivered" class="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Delivered
                </span>
                <span v-else class="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Transit
                </span>
              </div>
            </div>

            <!-- Order Items List -->
            <div class="px-4 md:px-6 py-2">
              <div class="space-y-3">
                <div
                  v-for="(item, idx) in order.orderItems"
                  :key="idx"
                  class="flex items-center gap-3 md:gap-4 py-2"
                >
                  <!-- Product Image -->
                  <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                    <img
                      :src="item.image || 'https://via.placeholder.com/150'"
                      :alt="item.name"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Details -->
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-bold text-slate-900 truncate">{{ item.name }}</h4>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5">
                      <span class="text-[11px] font-semibold text-slate-500">Qty: {{ item.qty }}</span>
                      <span v-if="item.size" class="text-[11px] font-semibold text-slate-500 border-l border-slate-200 pl-2">{{ item.size }}</span>
                      <span v-if="item.color" class="flex items-center gap-1 text-[11px] font-semibold text-slate-500 border-l border-slate-200 pl-2">
                        <span class="w-2.5 h-2.5 rounded-full inline-block shadow-sm" :style="{ background: item.color }"></span>
                        {{ item.color }}
                      </span>
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="text-right shrink-0">
                    <p class="text-sm font-bold text-slate-900">${{ (item.price * item.qty).toFixed(2) }}</p>
                    <p v-if="item.qty > 1" class="text-[10px] text-slate-400 mt-0.5">${{ item.price.toFixed(2) }} ea</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Minimal Combined Footer -->
            <div class="px-4 md:px-6 py-4 mt-2 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100">
              <div class="flex items-start gap-2.5">
                <MapPin class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p class="font-bold text-slate-800 text-xs mb-0.5">
                    {{ order.shippingAddress?.fullName || profile.fullName }} <span class="text-slate-500 font-normal ml-1">({{ order.shippingAddress?.phone || profile.phone || 'No phone' }})</span>
                  </p>
                  <p class="text-slate-500 text-[11px] max-w-[240px] sm:max-w-xs truncate">
                    {{ order.shippingAddress?.address || 'Standard Address' }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center justify-between md:justify-end w-full md:w-auto gap-5">
                <div class="flex flex-col text-left md:text-right">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Total Paid</span>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-lg font-black text-slate-900 leading-none">${{ Number(order.totalPrice).toFixed(2) }}</span>
                  </div>
                </div>
                <!-- Action buttons -->
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    @click="openTrackingModal(order)"
                    class="px-3 md:px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    Track
                  </button>
                  <button
                    @click="openReceiptModal(order)"
                    class="px-3 md:px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                    <span class="hidden sm:inline">Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div v-if="totalPages > 1" class="flex items-center justify-between pt-6">
            <span class="text-sm text-gray-500">
              Showing <span class="font-bold text-black">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> to 
              <span class="font-bold text-black">{{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }}</span> of 
              <span class="font-bold text-black">{{ filteredOrders.length }}</span>
            </span>
            <div class="flex items-center gap-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              
              <div class="flex items-center gap-1">
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'w-8 h-8 rounded-lg text-sm font-bold transition-all',
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  ]"
                >
                  {{ page }}
                </button>
              </div>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
      </transition>

      <!-- TAB 2: PERSONAL INFO -->
      <transition name="fade" mode="out-in">
      <div v-if="activeTab === 'profile'" class="space-y-6" key="profile">
        <div class="bg-white rounded-xl p-8 sm:p-10 border border-gray-200">
          
          <div class="pb-6 mb-8 border-b border-gray-200">
            <h2 class="text-xl font-bold text-black tracking-tight">Personal Information</h2>
            <p class="text-sm text-gray-500 mt-1">Manage your personal identity, contact details, and account name.</p>
          </div>

          <form @submit.prevent="saveProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <!-- Full Name -->
              <div class="space-y-2">
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Full Name
                </label>
                <div class="relative">
                  <User class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="profile.fullName"
                    type="text"
                    placeholder="e.g. John Doe"
                    class="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-300 text-sm font-semibold text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>

              <!-- Email (Read only) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Email Address
                  </label>
                  <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">Locked</span>
                </div>
                <div class="relative">
                  <Mail class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="profile.email"
                    type="email"
                    disabled
                    class="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm font-semibold cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <!-- Phone Number -->
              <div class="space-y-2">
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Phone Number
                </label>
                <div class="relative">
                  <Phone class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="profile.phone"
                    type="tel"
                    placeholder="e.g. 012 345 678"
                    class="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-300 text-sm font-semibold text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
                <p class="text-xs text-gray-500">Used by courier drivers for delivery arrival notifications.</p>
              </div>

              <!-- Telegram Username -->
              <div class="space-y-2">
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Telegram Username
                </label>
                <div class="relative">
                  <Send class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="profile.telegram"
                    type="text"
                    placeholder="e.g. @username"
                    class="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-300 text-sm font-semibold text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                </div>
                <p class="text-xs text-gray-500">Allows customer care to share dispatch tracking slips directly.</p>
              </div>

              <!-- Full Address -->
              <div class="md:col-span-2 space-y-2">
                <label class="block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Primary Delivery Address
                </label>
                <div class="relative">
                  <MapPin class="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    v-model="profile.address"
                    rows="3"
                    placeholder="Street #, Sangkat/Khan, Province or City"
                    class="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-300 text-sm font-semibold text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>

            </div>

            <div class="pt-8 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                :disabled="isSaving"
                class="inline-flex items-center gap-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold transition-all"
              >
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                <Save v-else class="w-4 h-4" />
                <span>{{ isSaving ? 'Saving...' : 'Save Profile' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      </transition>

      <!-- TAB 3: SECURITY & 2FA -->
      <transition name="fade" mode="out-in">
      <div v-if="activeTab === 'security'" class="space-y-6" key="security">
        <div class="bg-white rounded-xl p-8 sm:p-10 border border-gray-200">

          <div class="pb-6 mb-8 border-b border-gray-200">
            <h2 class="text-xl font-bold text-black tracking-tight">Account Security</h2>
            <p class="text-sm text-gray-500 mt-1">Protect your account and purchases with multi-factor verification.</p>
          </div>

          <!-- 2FA Card -->
          <div class="p-6 sm:p-8 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div class="flex items-start gap-5">
              <div :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border',
                is2FAEnabled ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-500'
              ]">
                <ShieldCheck v-if="is2FAEnabled" class="w-6 h-6" />
                <ShieldAlert v-else class="w-6 h-6" />
              </div>
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h3 class="text-base font-bold text-black">Two-Factor Authentication (2FA)</h3>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest',
                      is2FAEnabled ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                    ]"
                  >
                    {{ is2FAEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 max-w-xl">
                  Require a dynamic one-time verification token on login attempts to keep your payment details and order deliveries protected.
                </p>
              </div>
            </div>

            <!-- Toggle switch (Classic monochrome styling) -->
            <label class="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" v-model="is2FAEnabled" @change="saveProfile" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          <!-- Password Info -->
          <div class="p-6 sm:p-8 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                <Key class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-black">Authentication Method</h4>
                <p class="text-xs text-gray-500 mt-0.5">
                  Securely authenticated via Email or Google Sign-In.
                </p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-white border border-gray-200 text-black">
              <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Active Session
            </span>
          </div>
        </div>
      </div>
      </transition>

      <!-- TAB 4: SHIPPING ADDRESS -->
      <transition name="fade" mode="out-in">
      <div v-if="activeTab === 'address'" class="space-y-6" key="address">
        <div class="bg-white rounded-xl p-8 sm:p-10 border border-gray-200">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
            <div>
              <h2 class="text-xl font-bold text-black tracking-tight">Default Shipping Address</h2>
              <p class="text-sm text-gray-500 mt-1">Used as your default destination for fast deliveries.</p>
            </div>
            <button
              @click="activeTab = 'profile'"
              class="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Edit3 class="w-4 h-4" />
              <span>Edit Address</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Address Card -->
            <div class="p-6 sm:p-8 rounded-xl border-2 border-black bg-white relative">
              <span class="absolute top-4 right-4 px-2 py-1 bg-black text-white rounded text-[10px] font-bold uppercase tracking-widest">
                Primary
              </span>
              <div class="flex items-center gap-3 text-black font-bold text-lg mb-3">
                <MapPin class="w-5 h-5 text-gray-500" />
                <span>{{ profile.fullName || 'Default Contact' }}</span>
              </div>
              <p class="text-sm text-gray-600 mb-6 whitespace-pre-line leading-relaxed min-h-[3rem]">
                {{ profile.address || 'No full address specified yet. Click Edit Address to set your location.' }}
              </p>
              <div class="pt-5 border-t border-gray-200 flex flex-wrap items-center gap-6 text-sm font-bold text-black">
                <span class="flex items-center gap-2">
                  <Phone class="w-4 h-4 text-gray-500" />
                  {{ profile.phone || 'No phone set' }}
                </span>
                <span v-if="profile.telegram" class="flex items-center gap-2">
                  <Send class="w-4 h-4 text-gray-500" />
                  @{{ profile.telegram.replace('@', '') }}
                </span>
              </div>
            </div>

            <!-- Courier Info Box -->
            <div class="p-6 sm:p-8 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-3 text-black font-bold text-lg mb-3">
                  <Truck class="w-5 h-5 text-gray-500" />
                  <span>Express Dispatch Ready</span>
                </div>
                <p class="text-sm text-gray-600 leading-relaxed">
                  Orders are packaged and dispatched within 24 hours across all 25 provinces via Vireak Buntham & J&T Express.
                </p>
              </div>
              <div class="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-widest text-gray-500">Standard Delivery Rate</span>
                <span class="font-bold text-black text-sm">
                  $1.50 (PP) / $2.00 (Prov)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </transition>

    </div>

    <!-- ORDER RECEIPT / INVOICE MODAL -->
    <div
      v-if="isReceiptModalOpen && selectedOrder"
      class="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div class="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none my-auto sm:my-8 print:my-0">
        
        <!-- Print-only hide buttons container -->
        <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
           <h3 class="font-bold text-slate-800">Order Invoice</h3>
           <button @click="isReceiptModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors">
             <X class="w-5 h-5" />
           </button>
        </div>

        <!-- Printable Invoice Area -->
        <div class="p-8 sm:p-10 bg-white" id="invoice-printable-area">
          
          <!-- Invoice Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-slate-200">
            <div class="flex items-center gap-3">
               <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                 <Sparkles class="w-6 h-6" />
               </div>
               <div>
                 <h2 class="text-2xl font-black text-slate-900 tracking-tight leading-none">Next-Gen</h2>
                 <p class="text-[11px] font-bold tracking-widest text-indigo-600 uppercase mt-1">Streetwear</p>
               </div>
            </div>
            <div class="text-left sm:text-right w-full sm:w-auto">
               <h1 class="text-3xl font-black text-slate-200 tracking-widest uppercase mb-1">Invoice</h1>
               <p class="text-sm font-bold text-slate-700">#{{ selectedOrder._id.slice(-8).toUpperCase() }}</p>
            </div>
          </div>

          <!-- Billing & Details Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
              <h4 class="font-bold text-slate-900 text-base mb-1">{{ selectedOrder.shippingAddress?.fullName || profile.fullName }}</h4>
              <p class="text-sm text-slate-600 max-w-xs">{{ selectedOrder.shippingAddress?.address || 'Standard Address' }}</p>
              <p class="text-sm text-slate-600 mt-1">{{ selectedOrder.shippingAddress?.phone || profile.phone }}</p>
            </div>
            
            <div class="sm:text-right">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Details</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between sm:justify-end sm:gap-8">
                  <span class="text-slate-500">Date Issued:</span>
                  <span class="font-semibold text-slate-900">{{ formatDate(selectedOrder.createdAt) }}</span>
                </div>
                <div class="flex justify-between sm:justify-end sm:gap-8">
                  <span class="text-slate-500">Payment Method:</span>
                  <span class="font-semibold text-slate-900">{{ selectedOrder.paymentMethod || 'Bakong KHQR' }}</span>
                </div>
                <div class="flex justify-between sm:justify-end sm:gap-8">
                  <span class="text-slate-500">Payment Status:</span>
                  <span :class="selectedOrder.isPaid ? 'text-emerald-600' : 'text-amber-600'" class="font-bold tracking-wide">
                    {{ selectedOrder.isPaid ? 'PAID' : 'PENDING' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Table -->
          <div class="mt-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr class="border-y border-slate-200 bg-slate-50/50">
                    <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-full">Description</th>
                    <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center whitespace-nowrap">Qty</th>
                    <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Unit Price</th>
                    <th class="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(item, i) in selectedOrder.orderItems" :key="i">
                    <td class="py-4 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 hidden sm:block">
                          <img :src="item.image" class="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p class="font-bold text-slate-900 text-sm">{{ item.name }}</p>
                          <p class="text-[11px] font-semibold text-slate-500 mt-1" v-if="item.size || item.color">
                            {{ [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' • ') }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 text-center font-medium text-slate-700">{{ item.qty }}</td>
                    <td class="py-4 px-4 text-right font-medium text-slate-700">${{ Number(item.price).toFixed(2) }}</td>
                    <td class="py-4 px-4 text-right font-bold text-slate-900">${{ (item.price * item.qty).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Invoice Totals -->
          <div class="flex justify-end pt-6 border-t border-slate-200 mt-6">
            <div class="w-full sm:w-1/2 lg:w-1/3 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500 font-medium">Subtotal</span>
                <span class="font-bold text-slate-900">${{ Number(selectedOrder.itemsPrice || (selectedOrder.totalPrice - (selectedOrder.shippingPrice || 0))).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500 font-medium">Shipping Fee</span>
                <span class="font-bold text-slate-900">${{ Number(selectedOrder.shippingPrice || 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center pt-3 border-t border-slate-200">
                <span class="font-black text-slate-900 uppercase tracking-wide">Total Due</span>
                <span class="text-2xl font-black text-indigo-600">${{ Number(selectedOrder.totalPrice).toFixed(2) }}</span>
              </div>
            </div>
          </div>
          
          <div class="mt-16 pt-8 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-400 font-medium">
            <p>Thank you for shopping with Next-Gen Streetwear!</p>
            <p class="mt-1">If you have any questions concerning this invoice, contact support@nextgen.com</p>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 print:hidden">
          <button
            @click="isReceiptModalOpen = false"
            class="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-white hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="printReceipt"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Printer class="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ORDER TRACKING TIMELINE MODAL -->
    <div
      v-if="isTrackingModalOpen && selectedOrder"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    >
      <div class="bg-white rounded-xl max-w-md w-full p-8 shadow-xl border border-gray-200">
        
        <div class="flex items-start justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 class="text-lg font-bold text-black">Track Order Delivery</h3>
            <p class="text-xs text-gray-500 font-mono mt-1">#{{ selectedOrder._id.slice(-8).toUpperCase() }}</p>
          </div>
          <button
            @click="isTrackingModalOpen = false"
            class="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Stepper Timeline -->
        <div class="py-8 space-y-6">
          
          <!-- Step 1: Order Placed -->
          <div class="flex gap-4">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <Check class="w-4 h-4" />
              </div>
              <div class="w-0.5 h-full bg-indigo-600 min-h-[36px]"></div>
            </div>
            <div>
              <h4 class="text-sm font-bold text-black">Order Placed</h4>
              <p class="text-xs text-gray-500 mt-1">Order received and logged in system.</p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
          </div>

          <!-- Step 2: Payment Verified -->
          <div class="flex gap-4">
            <div class="flex flex-col items-center">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2',
                  selectedOrder.isPaid ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                ]"
              >
                <Check v-if="selectedOrder.isPaid" class="w-4 h-4" />
                <Clock v-else class="w-4 h-4" />
              </div>
              <div
                :class="[
                  'w-0.5 h-full min-h-[36px]',
                  selectedOrder.isPaid ? 'bg-indigo-600' : 'bg-gray-200'
                ]"
              ></div>
            </div>
            <div>
              <h4 class="text-sm font-bold text-black">
                {{ selectedOrder.isPaid ? 'Payment Confirmed' : 'Payment Pending' }}
              </h4>
              <p class="text-xs text-gray-500 mt-1">
                {{ selectedOrder.isPaid ? 'Transaction verified.' : 'Pending payment receipt.' }}
              </p>
            </div>
          </div>

          <!-- Step 3: Courier Dispatched -->
          <div class="flex gap-4">
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full border-2 border-gray-300 bg-white text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                <Truck class="w-4 h-4" />
              </div>
              <div
                :class="[
                  'w-0.5 h-full min-h-[36px]',
                  selectedOrder.isDelivered ? 'bg-indigo-600' : 'bg-gray-200'
                ]"
              ></div>
            </div>
            <div>
              <h4 class="text-sm font-bold text-black">Dispatched via {{ selectedOrder.deliveryCompany || 'Courier' }}</h4>
              <p class="text-xs text-gray-500 mt-1">Package handed over to delivery branch.</p>
            </div>
          </div>

          <!-- Step 4: Delivered -->
          <div class="flex gap-4">
            <div class="flex flex-col items-center">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2',
                  selectedOrder.isDelivered ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                ]"
              >
                <CheckCircle2 class="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 class="text-sm font-bold text-black">
                {{ selectedOrder.isDelivered ? 'Successfully Delivered' : 'Out For Delivery' }}
              </h4>
              <p class="text-xs text-gray-500 mt-1">
                {{ selectedOrder.isDelivered ? 'Package handed to recipient.' : 'Courier is en route.' }}
              </p>
            </div>
          </div>

        </div>

        <button
          @click="isTrackingModalOpen = false"
          class="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
        >
          Got It
        </button>

      </div>
    </div>

  </div>
</template>



<style>
@media print {
  @page {
    size: letter portrait;
    margin: 0.5in;
  }
}
</style>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>