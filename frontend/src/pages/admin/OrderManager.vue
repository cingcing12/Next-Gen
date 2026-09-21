<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Package, Truck, CheckCircle2, XCircle, Clock, Search,
  ChevronRight, ChevronLeft, X, RefreshCw, DollarSign, MapPin, Phone,
  ShoppingBag, User, QrCode, CreditCard, Calendar, Hash,
  ArrowUpRight, AlertCircle, Loader2
} from 'lucide-vue-next'
import { useUIStore } from '../../stores/ui'
import api from '../../api/axios'

const ui = useUIStore()

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const activeFilter = ref('all')   // all | paid | unpaid | delivered | pending
const selectedOrder = ref(null)   // detail panel
const updatingId = ref(null)      // which order is being updated

const currentPage = ref(1)
const itemsPerPage = ref(10)

// ── Fetch ──────────────────────────────────────────────────────────────────
const fetchOrders = async () => {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/orders')
    orders.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = 'Failed to load orders. Please try again.'
  } finally {
    loading.value = false
  }
}

import { onUnmounted } from 'vue'

onMounted(() => {
  fetchOrders()
  window.addEventListener('system:user_updated', fetchOrders)
  window.addEventListener('system:order_updated', fetchOrders)
})

onUnmounted(() => {
  window.removeEventListener('system:user_updated', fetchOrders)
  window.removeEventListener('system:order_updated', fetchOrders)
})

// ── Filters ────────────────────────────────────────────────────────────────
const filteredOrders = computed(() => {
  let list = [...orders.value]

  // Status tab
  if (activeFilter.value === 'paid')       list = list.filter(o => o.isPaid)
  else if (activeFilter.value === 'unpaid')    list = list.filter(o => !o.isPaid)
  else if (activeFilter.value === 'delivered') list = list.filter(o => o.isDelivered)
  else if (activeFilter.value === 'pending')   list = list.filter(o => !o.isDelivered)

  // Search
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(o =>
      (o._id || '').toLowerCase().includes(q) ||
      (o.user?.fullName || o.shippingAddress?.fullName || '').toLowerCase().includes(q) ||
      (o.shippingAddress?.phone || '').toLowerCase().includes(q)
    )
  }

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

watch([activeFilter, searchQuery], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage.value) || 1)

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredOrders.value.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const tabCounts = computed(() => ({
  all: orders.value.length,
  paid: orders.value.filter(o => o.isPaid).length,
  unpaid: orders.value.filter(o => !o.isPaid).length,
  delivered: orders.value.filter(o => o.isDelivered).length,
  pending: orders.value.filter(o => !o.isDelivered).length,
}))

// ── Actions ────────────────────────────────────────────────────────────────
const markAsDelivered = async (order) => {
  if (updatingId.value) return
  updatingId.value = order._id
  try {
    const { data } = await api.put(`/orders/${order._id}/deliver`)
    // Update in list and detail panel
    const idx = orders.value.findIndex(o => o._id === order._id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...data }
    if (selectedOrder.value?._id === order._id) selectedOrder.value = { ...selectedOrder.value, ...data }
    ui.toast('Order marked as delivered! 🚚', 'success')
  } catch {
    ui.toast('Failed to update delivery status', 'error')
  } finally {
    updatingId.value = null
  }
}

const markAsPaid = async (order) => {
  if (updatingId.value) return
  updatingId.value = order._id
  try {
    const { data } = await api.put(`/orders/${order._id}/pay`, {
      id: 'admin-manual',
      status: 'COMPLETED',
      update_time: new Date().toISOString(),
      payer: { email_address: 'admin@manual' }
    })
    const idx = orders.value.findIndex(o => o._id === order._id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...data }
    if (selectedOrder.value?._id === order._id) selectedOrder.value = { ...selectedOrder.value, ...data }
    ui.toast('Order marked as paid! ✅', 'success')
  } catch {
    ui.toast('Failed to update payment status', 'error')
  } finally {
    updatingId.value = null
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const openDetail = (order) => { selectedOrder.value = order }
const closeDetail = () => { selectedOrder.value = null }

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const getOrderStatus = (o) => {
  if (o.isDelivered) return { label: 'Delivered', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' }
  if (o.isPaid)      return { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
  return { label: 'Unpaid', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'pending', label: 'Pending' },
]
</script>

<template>
  <div class="space-y-6 relative">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShoppingBag class="w-8 h-8 text-indigo-600" />
          <span>Order Management</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          {{ orders.length }} total orders · click any row to view details
        </p>
      </div>
      <button
        @click="fetchOrders"
        :disabled="loading"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-semibold shadow-sm transition disabled:opacity-50"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- ── Stat Pills ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Package class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Total</p>
          <p class="text-xl font-black text-slate-900">{{ orders.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Paid</p>
          <p class="text-xl font-black text-slate-900">{{ tabCounts.paid }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Truck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Delivered</p>
          <p class="text-xl font-black text-slate-900">{{ tabCounts.delivered }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Unpaid</p>
          <p class="text-xl font-black text-slate-900">{{ tabCounts.unpaid }}</p>
        </div>
      </div>
    </div>

    <!-- ── Table Card ──────────────────────────────────────────────────────── -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

      <!-- Filter bar -->
      <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50">
        <!-- Search -->
        <div class="relative w-full md:w-72">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search order ID, customer, phone..."
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto flex-shrink-0">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            @click="activeFilter = tab.key"
            :class="activeFilter === tab.key
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5"
          >
            {{ tab.label }}
            <span
              :class="activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
              class="text-[10px] font-black px-1.5 py-0.5 rounded-full"
            >{{ tabCounts[tab.key] }}</span>
          </button>
        </div>

        <span class="text-xs text-slate-400 font-medium ml-auto whitespace-nowrap">
          {{ filteredOrders.length }} results
        </span>
      </div>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="divide-y divide-slate-100">
          <div v-for="i in 6" :key="i" class="flex items-center gap-5 px-6 py-4">
            <div class="w-16 h-4 rounded skeleton"></div>
            <div class="flex items-center gap-2.5 flex-1">
              <div class="w-9 h-9 rounded-full skeleton flex-shrink-0"></div>
              <div class="space-y-1.5">
                <div class="w-28 h-3.5 rounded skeleton"></div>
                <div class="w-20 h-2.5 rounded skeleton"></div>
              </div>
            </div>
            <div class="w-20 h-3 rounded skeleton hidden sm:block"></div>
            <div class="w-16 h-5 rounded-full skeleton"></div>
            <div class="w-16 h-5 rounded-full skeleton"></div>
            <div class="w-14 h-4 rounded skeleton ml-auto"></div>
          </div>
        </div>
      </template>

      <!-- Error -->
      <div v-else-if="error" class="p-16 text-center">
        <AlertCircle class="w-12 h-12 text-rose-300 mx-auto mb-3" />
        <p class="font-bold text-slate-700">{{ error }}</p>
        <button @click="fetchOrders" class="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredOrders.length === 0" class="p-16 text-center">
        <Package class="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <p class="font-bold text-slate-700">No orders found</p>
        <p class="text-xs text-slate-400 mt-1">Try a different filter or search term.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-[11px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/30">
            <tr>
              <th class="py-3.5 px-6">Order</th>
              <th class="py-3.5 px-6">Customer</th>
              <th class="py-3.5 px-6 hidden md:table-cell">Date</th>
              <th class="py-3.5 px-6">Amount</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6">Delivery</th>
              <th class="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="order in paginatedOrders"
              :key="order._id"
              @click="openDetail(order)"
              class="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
            >
              <!-- Order ID -->
              <td class="py-4 px-6">
                <span class="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg group-hover:bg-indigo-100 transition">
                  #{{ String(order._id).slice(-6).toUpperCase() }}
                </span>
              </td>

              <!-- Customer -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-2.5">
                  <img
                    v-if="order.user?.image && !order.user.image.includes('via.placeholder')"
                    :src="order.user.image"
                    class="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-200"
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm flex-shrink-0">
                    {{ (order.shippingAddress?.fullName || order.user?.fullName || 'C').charAt(0) }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 text-xs">
                      {{ order.shippingAddress?.fullName || order.user?.fullName || 'Unknown' }}
                    </p>
                    <p class="text-[10px] text-slate-400">{{ order.shippingAddress?.phone || '—' }}</p>
                  </div>
                </div>
              </td>

              <!-- Date -->
              <td class="py-4 px-6 text-slate-500 text-xs hidden md:table-cell">
                {{ new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </td>

              <!-- Amount -->
              <td class="py-4 px-6 font-bold text-slate-900 text-sm">
                {{ formatCurrency(order.totalPrice) }}
              </td>

              <!-- Paid status -->
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  :class="order.isPaid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="order.isPaid ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  {{ order.isPaid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>

              <!-- Delivery status -->
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  :class="order.isDelivered
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'"
                >
                  <Truck v-if="order.isDelivered" class="w-3 h-3" />
                  <Clock v-else class="w-3 h-3" />
                  {{ order.isDelivered ? 'Delivered' : 'Pending' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-4 px-6 text-right" @click.stop>
                <div class="flex items-center justify-end gap-2">
                  <!-- Mark Paid -->
                  <button
                    v-if="!order.isPaid"
                    @click.stop="markAsPaid(order)"
                    :disabled="updatingId === order._id"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition disabled:opacity-50"
                  >
                    <Loader2 v-if="updatingId === order._id" class="w-3 h-3 animate-spin" />
                    <CheckCircle2 v-else class="w-3 h-3" />
                    Mark Paid
                  </button>
                  <!-- Mark Delivered -->
                  <button
                    v-if="!order.isDelivered"
                    @click.stop="markAsDelivered(order)"
                    :disabled="updatingId === order._id"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition disabled:opacity-50"
                  >
                    <Loader2 v-if="updatingId === order._id" class="w-3 h-3 animate-spin" />
                    <Truck v-else class="w-3 h-3" />
                    Mark Delivered
                  </button>
                  <!-- View detail arrow -->
                  <button
                    @click.stop="openDetail(order)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition"
                    title="View details"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
        <span class="text-xs text-slate-500 font-medium">
          Showing <span class="font-bold text-slate-900">{{ filteredOrders.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}</span> to <span class="font-bold text-slate-900">{{ Math.min(currentPage * itemsPerPage, filteredOrders.length) }}</span> of <span class="font-bold text-slate-900">{{ filteredOrders.length }}</span> results
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

    <!-- ══ ORDER DETAIL SLIDE-OVER ══════════════════════════════════════════ -->
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="selectedOrder"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        @click="closeDetail"
      ></div>
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div
        v-if="selectedOrder"
        class="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Panel Header -->
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Details</p>
            <h3 class="text-lg font-black text-slate-900 font-mono mt-0.5">
              #{{ String(selectedOrder._id).slice(-6).toUpperCase() }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
              :class="getOrderStatus(selectedOrder).color"
            >
              <span class="w-2 h-2 rounded-full" :class="getOrderStatus(selectedOrder).dot"></span>
              {{ getOrderStatus(selectedOrder).label }}
            </span>
            <button
              @click="closeDetail"
              class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Panel Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              v-if="!selectedOrder.isPaid"
              @click="markAsPaid(selectedOrder)"
              :disabled="updatingId === selectedOrder._id"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Loader2 v-if="updatingId === selectedOrder._id" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" />
              Mark as Paid
            </button>
            <div v-else class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200">
              <CheckCircle2 class="w-4 h-4" />
              Payment Confirmed
            </div>

            <button
              v-if="!selectedOrder.isDelivered"
              @click="markAsDelivered(selectedOrder)"
              :disabled="updatingId === selectedOrder._id"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <Loader2 v-if="updatingId === selectedOrder._id" class="w-4 h-4 animate-spin" />
              <Truck v-else class="w-4 h-4" />
              Mark Delivered
            </button>
            <div v-else class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-700 text-sm font-bold border border-sky-200">
              <Truck class="w-4 h-4" />
              Delivered ✓
            </div>
          </div>

          <!-- Customer Info -->
          <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5" /> Customer
            </p>
            <div class="flex items-center gap-3">
              <img
                v-if="selectedOrder.user?.image && !selectedOrder.user.image.includes('via.placeholder')"
                :src="selectedOrder.user.image"
                class="w-11 h-11 rounded-full object-cover shadow-md flex-shrink-0 border border-slate-200"
              />
              <div v-else class="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-sm flex items-center justify-center uppercase shadow-md flex-shrink-0">
                {{ (selectedOrder.shippingAddress?.fullName || selectedOrder.user?.fullName || 'C').charAt(0) }}
              </div>
              <div>
                <p class="font-bold text-slate-900">{{ selectedOrder.shippingAddress?.fullName || selectedOrder.user?.fullName || '—' }}</p>
                <p class="text-xs text-slate-500">{{ selectedOrder.user?.email || '—' }}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-slate-50 rounded-2xl p-4 space-y-2.5">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5" /> Shipping Address
            </p>
            <div class="text-sm text-slate-700 space-y-1">
              <p class="font-semibold">{{ selectedOrder.shippingAddress?.fullName || '—' }}</p>
              <p>{{ selectedOrder.shippingAddress?.address || '—' }}</p>
              <p>{{ [selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.province].filter(Boolean).join(', ') || '—' }}</p>
              <div class="flex items-center gap-1.5 text-slate-500 mt-1">
                <Phone class="w-3.5 h-3.5" />
                <span>{{ selectedOrder.shippingAddress?.phone || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Order Info -->
          <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Hash class="w-3.5 h-3.5" /> Order Info
            </p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-slate-500 flex items-center gap-1.5"><Calendar class="w-3.5 h-3.5" /> Placed</span>
                <span class="font-semibold text-slate-800">{{ formatDate(selectedOrder.createdAt) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 flex items-center gap-1.5">
                  <QrCode v-if="selectedOrder.paymentMethod === 'bakong'" class="w-3.5 h-3.5 text-red-500" />
                  <CreditCard v-else class="w-3.5 h-3.5" />
                  Payment
                </span>
                <span class="font-semibold text-slate-800 capitalize">{{ selectedOrder.paymentMethod === 'bakong' ? 'Bakong KHQR' : 'Cash on Delivery' }}</span>
              </div>
              <div v-if="selectedOrder.isPaid && selectedOrder.paidAt" class="flex items-center justify-between">
                <span class="text-slate-500">Paid at</span>
                <span class="font-semibold text-emerald-700">{{ formatDate(selectedOrder.paidAt) }}</span>
              </div>
              <div v-if="selectedOrder.isDelivered && selectedOrder.deliveredAt" class="flex items-center justify-between">
                <span class="text-slate-500">Delivered at</span>
                <span class="font-semibold text-sky-700">{{ formatDate(selectedOrder.deliveredAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div class="space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShoppingBag class="w-3.5 h-3.5" /> Items ({{ selectedOrder.orderItems?.length || 0 }})
            </p>
            <div class="space-y-2">
              <div
                v-for="item in selectedOrder.orderItems"
                :key="item._id || item.product"
                class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <img
                  :src="item.image || 'https://via.placeholder.com/48'"
                  :alt="item.name"
                  class="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 text-xs truncate">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    <span v-if="item.color">{{ item.color }}</span>
                    <span v-if="item.color && item.size"> · </span>
                    <span v-if="item.size">Size {{ item.size }}</span>
                  </p>
                  <p class="text-[10px] text-slate-400">Qty: {{ item.qty }} × {{ formatCurrency(item.price) }}</p>
                </div>
                <p class="font-bold text-slate-900 text-sm flex-shrink-0">
                  {{ formatCurrency(item.qty * item.price) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Price Breakdown -->
          <div class="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 space-y-2">
            <div class="flex justify-between text-sm text-indigo-200">
              <span>Subtotal</span>
              <span>{{ formatCurrency(selectedOrder.itemsPrice || selectedOrder.totalPrice) }}</span>
            </div>
            <div v-if="selectedOrder.shippingPrice" class="flex justify-between text-sm text-indigo-200">
              <span>Shipping</span>
              <span>{{ formatCurrency(selectedOrder.shippingPrice) }}</span>
            </div>
            <div v-if="selectedOrder.taxPrice" class="flex justify-between text-sm text-indigo-200">
              <span>Tax</span>
              <span>{{ formatCurrency(selectedOrder.taxPrice) }}</span>
            </div>
            <div class="flex justify-between font-black text-lg border-t border-white/10 pt-2 mt-1">
              <span>Total</span>
              <span>{{ formatCurrency(selectedOrder.totalPrice) }}</span>
            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite ease-in-out;
  border-radius: 0.5rem;
}

/* Backdrop transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Slide-over transition */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
