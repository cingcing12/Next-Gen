<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  QrCode,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  BarChart3,
  InboxIcon
} from 'lucide-vue-next'
import api from '../../api/axios'

const router = useRouter()

const loading = ref(true)
const orders = ref([])
const products = ref([])
const users = ref([])
const categories = ref([])

const activeChartMetric = ref('revenue')
const activeOrderFilter = ref('all')
const orderSearchQuery = ref('')

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const [ordersRes, productsRes, usersRes, categoriesRes] = await Promise.allSettled([
      api.get('/orders'),
      api.get('/products'),
      api.get('/users'),
      api.get('/categories')
    ])
    if (ordersRes.status === 'fulfilled') {
      orders.value = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []
    }
    if (productsRes.status === 'fulfilled') {
      const pData = productsRes.value.data
      products.value = Array.isArray(pData) ? pData : (pData.products || [])
    }
    if (usersRes.status === 'fulfilled') {
      users.value = Array.isArray(usersRes.value.data) ? usersRes.value.data : []
    }
    if (categoriesRes.status === 'fulfilled') {
      categories.value = Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []
    }
  } catch (error) {
    console.error('Dashboard fetch error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
  window.addEventListener('system:user_updated', fetchDashboardData)
  window.addEventListener('system:order_updated', fetchDashboardData)
})

onUnmounted(() => {
  window.removeEventListener('system:user_updated', fetchDashboardData)
  window.removeEventListener('system:order_updated', fetchDashboardData)
})

// ── Real data computed (no fallback numbers) ────────────────────────────────
const totalRevenue = computed(() =>
  orders.value.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
)
const totalOrdersCount = computed(() => orders.value.length)
const paidOrdersCount = computed(() => orders.value.filter(o => o.isPaid).length)
const pendingOrdersCount = computed(() => orders.value.filter(o => !o.isPaid).length)
const deliveredOrdersCount = computed(() => orders.value.filter(o => o.isDelivered).length)
const totalCustomersCount = computed(() => users.value.length)
const lowStockProducts = computed(() => products.value.filter(p => p.stock !== undefined && p.stock <= 5))

// ── Weekly chart: 100% real data, grouped by day ────────────────────────────
const weeklyChartData = computed(() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date()
  const revenueByDay = Array(7).fill(0)
  const ordersByDay  = Array(7).fill(0)

  orders.value.forEach(o => {
    const d = new Date(o.createdAt)
    // day of week 0=Sun..6=Sat, shift so Mon=0
    const dow = (d.getDay() + 6) % 7
    revenueByDay[dow] += o.totalPrice || 0
    ordersByDay[dow]++
  })

  const maxRev = Math.max(...revenueByDay, 1)
  const maxOrd = Math.max(...ordersByDay, 1)

  return days.map((day, idx) => ({
    day,
    revenue: revenueByDay[idx],
    orders: ordersByDay[idx],
    revHeight: Math.round((revenueByDay[idx] / maxRev) * 100),
    ordHeight: Math.round((ordersByDay[idx] / maxOrd) * 100)
  }))
})

// ── Filtered recent orders (real only) ──────────────────────────────────────
const filteredRecentOrders = computed(() => {
  let list = [...orders.value]

  if (activeOrderFilter.value === 'paid')      list = list.filter(o => o.isPaid)
  else if (activeOrderFilter.value === 'pending')   list = list.filter(o => !o.isPaid)
  else if (activeOrderFilter.value === 'delivered') list = list.filter(o => o.isDelivered)

  if (orderSearchQuery.value.trim()) {
    const q = orderSearchQuery.value.toLowerCase()
    list = list.filter(o =>
      (o._id || '').toLowerCase().includes(q) ||
      (o.shippingAddress?.fullName || o.user?.fullName || '').toLowerCase().includes(q)
    )
  }
  return list.slice(0, 7)
})

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-8">

    <!-- ══ LOADING SKELETON ══════════════════════════════════════════════════ -->
    <template v-if="loading">


      <!-- Hero banner skeleton -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div class="space-y-3 flex-1">
            <div class="skeleton-dark h-5 w-28 rounded-full"></div>
            <div class="skeleton-dark h-9 w-72 max-w-full"></div>
            <div class="skeleton-dark h-4 w-96 max-w-full"></div>
          </div>
          <div class="flex gap-3">
            <div class="skeleton-dark h-10 w-28 rounded-xl"></div>
            <div class="skeleton-dark h-10 w-28 rounded-xl"></div>
          </div>
        </div>
      </div>

      <!-- 4 KPI card skeletons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div class="skeleton w-12 h-12 rounded-2xl"></div>
            <div class="skeleton h-6 w-20 rounded-full"></div>
          </div>
          <div class="space-y-2 mt-4">
            <div class="skeleton h-3 w-24"></div>
            <div class="skeleton h-9 w-36"></div>
            <div class="skeleton h-3 w-32"></div>
          </div>
        </div>
      </div>

      <!-- Chart + Quick Actions skeletons -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Chart skeleton (8 cols) -->
        <div class="lg:col-span-8 bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between mb-8">
            <div class="space-y-2">
              <div class="skeleton h-5 w-40"></div>
              <div class="skeleton h-3 w-56"></div>
            </div>
            <div class="skeleton h-9 w-40 rounded-xl"></div>
          </div>
          <!-- Bars -->
          <div class="h-56 flex items-end justify-between gap-4 px-2">
            <div v-for="(b, i) in [70,50,85,45,95,60,75]" :key="i"
              class="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div class="w-full max-w-[48px] rounded-2xl overflow-hidden"
                :style="{ height: `${b}%` }">
                <div class="skeleton w-full h-full rounded-2xl"></div>
              </div>
              <div class="skeleton h-3 w-8"></div>
            </div>
          </div>
        </div>

        <!-- Quick Actions skeleton (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div class="skeleton h-5 w-32"></div>
            <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50">
              <div class="skeleton w-9 h-9 rounded-xl flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="skeleton h-3 w-28"></div>
                <div class="skeleton h-2.5 w-36"></div>
              </div>
            </div>
          </div>
          <div class="skeleton h-36 rounded-3xl"></div>
        </div>
      </div>

      <!-- Orders table skeleton -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="skeleton h-5 w-48"></div>
            <div class="skeleton h-3 w-56"></div>
          </div>
          <div class="flex gap-3">
            <div class="skeleton h-8 w-40 rounded-xl"></div>
            <div class="skeleton h-8 w-28 rounded-xl"></div>
          </div>
        </div>
        <!-- Table rows -->
        <div class="divide-y divide-slate-100">
          <div v-for="i in 5" :key="i" class="flex items-center gap-6 px-6 py-4">
            <div class="skeleton h-4 w-16"></div>
            <div class="flex items-center gap-2.5 flex-1">
              <div class="skeleton w-8 h-8 rounded-full flex-shrink-0"></div>
              <div class="space-y-1.5">
                <div class="skeleton h-3 w-28"></div>
                <div class="skeleton h-2.5 w-20"></div>
              </div>
            </div>
            <div class="skeleton h-3 w-24"></div>
            <div class="skeleton h-6 w-24 rounded-full"></div>
            <div class="skeleton h-6 w-16 rounded-full"></div>
            <div class="skeleton h-4 w-16 ml-auto"></div>
          </div>
        </div>
      </div>

    </template>
    <!-- ══ END LOADING ═══════════════════════════════════════════════════════ -->


    <!-- ══ REAL CONTENT ══════════════════════════════════════════════════════ -->
    <template v-else>

      <!-- Header Greeting & Quick Refresh -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 -bottom-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
            <span>Store Analytics & Operations</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white">Welcome back, Admin 👋</h2>
          <p class="text-sm text-slate-300 mt-1 max-w-xl">
            Here is your store summary today. You have
            <span class="text-amber-400 font-bold">{{ pendingOrdersCount }} pending orders</span>
            waiting for fulfillment.
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-3">
          <button
            @click="fetchDashboardData"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition backdrop-blur-md cursor-pointer"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
          <router-link
            to="/admin/products"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/40 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Product</span>
          </router-link>
        </div>
      </div>

      <!-- 4 KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <!-- Revenue -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign class="w-6 h-6" />
            </div>
            <span v-if="totalRevenue > 0" class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp class="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</p>
            <p class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {{ formatCurrency(totalRevenue) }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1 font-medium">
              <span class="text-emerald-600 font-bold">{{ paidOrdersCount }} paid</span> via Bakong KHQR & COD
            </p>
          </div>
        </div>

        <!-- Orders -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package class="w-6 h-6" />
            </div>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <Clock class="w-3.5 h-3.5" /> {{ pendingOrdersCount }} pending
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
            <p class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {{ totalOrdersCount }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1 font-medium">
              <span class="text-indigo-600 font-bold">{{ deliveredOrdersCount }} delivered</span> • {{ pendingOrdersCount }} pending
            </p>
          </div>
        </div>

        <!-- Customers -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Customers</p>
            <p class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {{ totalCustomersCount }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1 font-medium">
              <span class="text-purple-600 font-bold">Active shoppers</span> across Cambodia
            </p>
          </div>
        </div>

        <!-- Catalog -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag class="w-6 h-6" />
            </div>
            <span
              class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border"
              :class="lowStockProducts.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
            >
              {{ lowStockProducts.length > 0 ? `${lowStockProducts.length} Low Stock` : 'Stock Healthy' }}
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Catalog Products</p>
            <p class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {{ products.length }}
            </p>
            <p class="text-[11px] text-slate-500 mt-1 font-medium">
              Across {{ categories.length }} categories
            </p>
          </div>
        </div>

      </div>

      <!-- Middle Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Performance Chart (8 cols) -->
        <div class="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 class="w-5 h-5 text-indigo-500" />
                Weekly Performance
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Real orders grouped by day of week</p>
            </div>
            <div class="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                @click="activeChartMetric = 'revenue'"
                :class="activeChartMetric === 'revenue' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
                class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >Revenue ($)</button>
              <button
                @click="activeChartMetric = 'orders'"
                :class="activeChartMetric === 'orders' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'"
                class="px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >Orders Count</button>
            </div>
          </div>

          <!-- Empty state for chart -->
          <div v-if="orders.length === 0" class="h-56 flex flex-col items-center justify-center text-slate-400 gap-3">
            <BarChart3 class="w-12 h-12 text-slate-200" />
            <p class="text-sm font-semibold text-slate-500">No orders yet</p>
            <p class="text-xs">Orders will appear here once customers start purchasing.</p>
          </div>

          <!-- Bar chart -->
          <div v-else class="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-8 px-2">
            <div
              v-for="item in weeklyChartData"
              :key="item.day"
              class="flex-1 flex flex-col items-center h-full justify-end group"
            >
              <div class="opacity-0 group-hover:opacity-100 transition-opacity mb-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap">
                {{ activeChartMetric === 'revenue' ? formatCurrency(item.revenue) : `${item.orders} Orders` }}
              </div>
              <div class="w-full max-w-[48px] bg-slate-100 rounded-2xl h-48 flex items-end p-1 overflow-hidden">
                <div
                  class="w-full rounded-xl transition-all duration-700 ease-out"
                  :class="activeChartMetric === 'revenue'
                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300'
                    : 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-300'"
                  :style="{ height: `${(activeChartMetric === 'revenue' ? item.revHeight : item.ordHeight) || 4}%` }"
                ></div>
              </div>
              <span class="text-xs font-bold text-slate-500 group-hover:text-indigo-600 mt-3 transition-colors">{{ item.day }}</span>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-md bg-indigo-600"></span>
              <span class="font-medium">Bakong KHQR Integrated Payment Gateway</span>
            </div>
            <span class="text-slate-400 font-medium">Updated on refresh</span>
          </div>
        </div>

        <!-- Quick Actions & Payment Widget (4 cols) -->
        <div class="lg:col-span-4 space-y-6">

          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 class="text-base font-bold text-slate-900 mb-4">Quick Operations</h3>
            <div class="space-y-2.5">
              <router-link to="/admin/products" class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><ShoppingBag class="w-4 h-4" /></div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Manage Products</p>
                    <p class="text-[11px] text-slate-400">Bulk upload & color variants</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </router-link>

              <router-link to="/admin/orders" class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><Package class="w-4 h-4" /></div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Customer Orders</p>
                    <p class="text-[11px] text-slate-400">Delivery status & KHQR checks</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </router-link>

              <router-link to="/admin/categories" class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Sparkles class="w-4 h-4" /></div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Categories</p>
                    <p class="text-[11px] text-slate-400">Organize store catalog</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </router-link>

              <router-link to="/admin/users" class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Users class="w-4 h-4" /></div>
                  <div>
                    <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Customer Accounts</p>
                    <p class="text-[11px] text-slate-400">Manage user access & roles</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
              </router-link>
            </div>
          </div>

          <!-- Payment Widget -->
          <div class="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-300">Payment Gateway</span>
              <QrCode class="w-5 h-5 text-indigo-300" />
            </div>
            <p class="text-xl font-bold">Bakong KHQR Active</p>
            <p class="text-xs text-indigo-200/80 mt-1">Accepting USD & KHR instant mobile payments directly via NBC Bakong.</p>
            <div class="mt-5 pt-4 border-t border-indigo-800/80 flex items-center justify-between text-xs">
              <span class="text-indigo-300">Instant Verification</span>
              <span class="inline-flex items-center gap-1 font-bold text-emerald-400">
                <CheckCircle2 class="w-3.5 h-3.5" /> Operational
              </span>
            </div>
          </div>

        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">

        <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900">Recent Customer Orders</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{{ filteredRecentOrders.length }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Real-time transactions and fulfillment tracker</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="relative">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="orderSearchQuery"
                type="text"
                placeholder="Search customer or order..."
                class="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none w-48 sm:w-56"
              />
            </div>
            <div class="inline-flex p-1 bg-slate-100 rounded-xl text-xs">
              <button
                v-for="tab in ['all', 'paid', 'pending', 'delivered']"
                :key="tab"
                @click="activeOrderFilter = tab"
                :class="activeOrderFilter === tab ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'"
                class="px-3 py-1 rounded-lg capitalize transition cursor-pointer"
              >{{ tab }}</button>
            </div>
            <router-link to="/admin/orders" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pl-2">
              <span>View All</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>

        <!-- Empty orders state -->
        <div v-if="filteredRecentOrders.length === 0" class="p-16 text-center">
          <div class="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Package class="w-10 h-10 text-slate-300" />
          </div>
          <p class="font-bold text-slate-700 text-base">No orders yet</p>
          <p class="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            {{ activeOrderFilter !== 'all' || orderSearchQuery ? 'No orders match your filter. Try changing tabs or clearing your search.' : 'Orders will appear here once customers start purchasing.' }}
          </p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50/70 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
              <tr>
                <th class="py-3.5 px-6">Order ID</th>
                <th class="py-3.5 px-6">Customer</th>
                <th class="py-3.5 px-6">Date</th>
                <th class="py-3.5 px-6">Payment</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Amount</th>
                <th class="py-3.5 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 text-xs">
              <tr v-for="order in filteredRecentOrders" :key="order._id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-mono font-bold text-indigo-600">#{{ String(order._id).slice(-6).toUpperCase() }}</td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2.5">
                    <img
                      v-if="order.user?.image && !order.user.image.includes('via.placeholder')"
                      :src="order.user.image"
                      class="w-8 h-8 rounded-full object-cover shadow-2xs flex-shrink-0 border border-slate-200"
                    />
                    <div v-else class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs flex-shrink-0">
                      {{ (order.shippingAddress?.fullName || order.user?.fullName || 'C').charAt(0) }}
                    </div>
                    <div>
                      <p class="font-bold text-slate-900">{{ order.shippingAddress?.fullName || order.user?.fullName || 'Walk-in Customer' }}</p>
                      <p class="text-[10px] text-slate-400">{{ order.shippingAddress?.phone || '+855 (Cambodia)' }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-500">{{ formatDate(order.createdAt) }}</td>
                <td class="py-4 px-6">
                  <span v-if="order.paymentMethod === 'bakong'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                    <QrCode class="w-3 h-3 text-red-600" /> Bakong KHQR
                  </span>
                  <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <CreditCard class="w-3 h-3 text-slate-500" /> Cash on Delivery
                  </span>
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      :class="order.isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                      <span class="w-1.5 h-1.5 rounded-full" :class="order.isPaid ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                      {{ order.isPaid ? 'Paid' : 'Unpaid' }}
                    </span>
                    <span v-if="order.isDelivered" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Delivered</span>
                  </div>
                </td>
                <td class="py-4 px-6 text-right font-bold text-slate-900 font-mono text-sm">{{ formatCurrency(order.totalPrice || 0) }}</td>
                <td class="py-4 px-6 text-center">
                  <router-link to="/admin/orders" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition">
                    <span>Details</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </template>
    <!-- ══ END REAL CONTENT ══════════════════════════════════════════════════ -->

  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    #f1f5f9 25%,
    #e2e8f0 50%,
    #f1f5f9 75%
  );
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite ease-in-out;
  border-radius: 0.75rem;
}

.skeleton-dark {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.06) 25%,
    rgba(255,255,255,0.13) 50%,
    rgba(255,255,255,0.06) 75%
  );
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite ease-in-out;
  border-radius: 0.75rem;
}
</style>
