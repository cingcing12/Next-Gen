<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Truck, Plus, Edit2, Trash2, X, Check, Loader2,
  ToggleLeft, ToggleRight, DollarSign, Clock, Search,
  Sparkles, Package, RefreshCw, AlertCircle, Zap
} from 'lucide-vue-next'
import { useShippingStore } from '../../stores/shipping'
import { useUIStore } from '../../stores/ui'

const shippingStore = useShippingStore()
const ui = useUIStore()

const showModal = ref(false)
const editingId = ref(null)
const isSaving = ref(false)
const togglingId = ref(null)
const searchQuery = ref('')

const EMOJI_OPTIONS = ['🚚','✈️','🏍️','📦','🛵','🚢','🏎️','🛺']

const form = ref({
  name: '', description: '', price: 0,
  estimatedDays: '', isActive: true, icon: '🚚'
})

onMounted(() => shippingStore.fetchMethods())

// ── Filtered list ──────────────────────────────────────────────────────────
const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return shippingStore.methods
  return shippingStore.methods.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q)
  )
})

const activeCount   = computed(() => shippingStore.methods.filter(m => m.isActive).length)
const inactiveCount = computed(() => shippingStore.methods.filter(m => !m.isActive).length)

// ── Modal ──────────────────────────────────────────────────────────────────
const openAddModal = () => {
  editingId.value = null
  form.value = { name: '', description: '', price: 0, estimatedDays: '', isActive: true, icon: '🚚' }
  showModal.value = true
}

const openEditModal = (m) => {
  editingId.value = m._id
  form.value = { name: m.name, description: m.description, price: m.price, estimatedDays: m.estimatedDays, isActive: m.isActive, icon: m.icon || '🚚' }
  showModal.value = true
}

const saveMethod = async () => {
  if (!form.value.name.trim()) { ui.toast('Name is required', 'error'); return }
  if (form.value.price < 0)    { ui.toast('Price cannot be negative', 'error'); return }

  isSaving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      price: Number(form.value.price),
      estimatedDays: form.value.estimatedDays.trim(),
      isActive: form.value.isActive,
      icon: form.value.icon
    }
    if (editingId.value) {
      await shippingStore.updateMethod(editingId.value, payload)
      ui.toast('Shipping method updated! ✓', 'success')
    } else {
      await shippingStore.createMethod(payload)
      ui.toast('Shipping method added! ✓', 'success')
    }
    showModal.value = false
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Failed to save', 'error')
  } finally {
    isSaving.value = false
  }
}

const toggleActive = async (method) => {
  togglingId.value = method._id
  try {
    await shippingStore.toggleMethod(method._id)
    ui.toast(method.isActive ? 'Method disabled' : 'Method enabled ✓', method.isActive ? 'warning' : 'success')
  } catch {
    ui.toast('Failed to toggle status', 'error')
  } finally {
    togglingId.value = null
  }
}

const deleteMethod = async (id) => {
  if (await ui.confirm('Delete Shipping Method', 'This will remove this shipping option from checkout.', 'danger')) {
    try {
      await shippingStore.deleteMethod(id)
      ui.toast('Shipping method deleted', 'success')
    } catch {
      ui.toast('Failed to delete', 'error')
    }
  }
}

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)
</script>

<template>
  <div class="space-y-8">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Truck class="w-8 h-8 text-indigo-600" />
          <span>Shipping Methods</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Manage delivery options shown at checkout.
          <span class="font-semibold text-indigo-600">{{ activeCount }}</span> active ·
          <span class="font-semibold text-slate-400">{{ inactiveCount }}</span> disabled.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="shippingStore.fetchMethods()"
          :disabled="shippingStore.loading"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-sm font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': shippingStore.loading }" />
          Refresh
        </button>
        <button
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus class="w-5 h-5" />
          Add Method
        </button>
      </div>
    </div>

    <!-- ── Stat Pills ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Truck class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Total Methods</p>
          <p class="text-2xl font-black text-slate-900">{{ shippingStore.methods.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Zap class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Active at Checkout</p>
          <p class="text-2xl font-black text-slate-900">{{ activeCount }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
          <Package class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Disabled</p>
          <p class="text-2xl font-black text-slate-900">{{ inactiveCount }}</p>
        </div>
      </div>
    </div>

    <!-- ── Search + Cards ──────────────────────────────────────────────────── -->
    <div class="space-y-4">
      <!-- Search -->
      <div class="relative max-w-sm">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search shipping methods..."
          class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-sm"
        />
      </div>

      <!-- Loading -->
      <template v-if="shippingStore.loading">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="i in 3" :key="i" class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="skeleton w-14 h-14 rounded-2xl"></div>
              <div class="space-y-2 flex-1">
                <div class="skeleton h-4 w-32"></div>
                <div class="skeleton h-3 w-20"></div>
              </div>
            </div>
            <div class="skeleton h-3 w-full"></div>
            <div class="skeleton h-3 w-3/4"></div>
            <div class="flex gap-2">
              <div class="skeleton h-8 w-20 rounded-xl"></div>
              <div class="skeleton h-8 w-20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Error -->
      <div v-else-if="shippingStore.error" class="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle class="w-12 h-12 text-rose-300 mb-3" />
        <p class="font-bold text-slate-700">{{ shippingStore.error }}</p>
        <button @click="shippingStore.fetchMethods()" class="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5 text-5xl">🚚</div>
        <h3 class="text-lg font-bold text-slate-700">{{ searchQuery ? 'No methods found' : 'No shipping methods yet' }}</h3>
        <p class="text-sm text-slate-400 mt-1 max-w-xs">
          {{ searchQuery ? 'Try a different search term.' : 'Add your first shipping method to let customers choose at checkout.' }}
        </p>
        <button v-if="!searchQuery" @click="openAddModal"
          class="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-indigo-600/25 transition">
          <Plus class="w-5 h-5" /> Add First Method
        </button>
      </div>

      <!-- Shipping Cards Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="method in filtered"
          :key="method._id"
          class="group relative bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
          :class="method.isActive ? 'border-slate-100 hover:border-indigo-200' : 'border-slate-100 opacity-70'"
        >
          <!-- Active indicator strip -->
          <div class="h-1 w-full" :class="method.isActive ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-slate-200'"></div>

          <div class="p-5 flex-1 flex flex-col gap-4">
            <!-- Top row: icon + name + status toggle -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Big emoji icon -->
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border flex-shrink-0"
                  :class="method.isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'">
                  {{ method.icon || '🚚' }}
                </div>
                <div>
                  <h3 class="font-extrabold text-slate-900 text-base leading-tight">{{ method.name }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-flex items-center gap-1 text-xs font-bold"
                      :class="method.isActive ? 'text-emerald-600' : 'text-slate-400'">
                      <span class="w-1.5 h-1.5 rounded-full" :class="method.isActive ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                      {{ method.isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Toggle button -->
              <button
                @click="toggleActive(method)"
                :disabled="togglingId === method._id"
                class="flex-shrink-0 p-1 rounded-xl transition hover:bg-slate-50"
                :title="method.isActive ? 'Disable' : 'Enable'"
              >
                <Loader2 v-if="togglingId === method._id" class="w-6 h-6 text-indigo-500 animate-spin" />
                <ToggleRight v-else-if="method.isActive" class="w-7 h-7 text-indigo-500" />
                <ToggleLeft v-else class="w-7 h-7 text-slate-300" />
              </button>
            </div>

            <!-- Description -->
            <p class="text-sm text-slate-500 leading-relaxed min-h-[2.5rem]">
              {{ method.description || 'No description provided.' }}
            </p>

            <!-- Price + ETA chips -->
            <div class="flex flex-wrap items-center gap-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <DollarSign class="w-3.5 h-3.5" />
                {{ formatCurrency(method.price) }}
              </div>
              <div v-if="method.estimatedDays" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Clock class="w-3 h-3" />
                {{ method.estimatedDays }}
              </div>
            </div>
          </div>

          <!-- Card footer actions -->
          <div class="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span class="text-[10px] text-slate-400 font-mono">ID: {{ method._id.slice(-6).toUpperCase() }}</span>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openEditModal(method)"
                class="w-8 h-8 rounded-xl bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200 flex items-center justify-center transition"
                title="Edit"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button
                @click="deleteMethod(method._id)"
                class="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 flex items-center justify-center transition"
                title="Delete"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add new card shortcut -->
        <button
          @click="openAddModal"
          class="group border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 transition-all min-h-[200px] bg-transparent hover:bg-indigo-50/30"
        >
          <div class="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition">
            <Plus class="w-7 h-7" />
          </div>
          <p class="text-sm font-bold">Add New Method</p>
        </button>
      </div>
    </div>

    <!-- ── Checkout Preview ────────────────────────────────────────────────── -->
    <div v-if="shippingStore.methods.filter(m => m.isActive).length > 0" class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div>
        <h3 class="font-bold text-slate-900 flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-indigo-500" />
          Checkout Preview
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">This is how your active shipping options appear to customers at checkout.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="(method, idx) in shippingStore.methods.filter(m => m.isActive)"
          :key="method._id"
          class="relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer"
          :class="idx === 0
            ? 'border-indigo-500 bg-indigo-50/60 shadow-sm shadow-indigo-100'
            : 'border-slate-200 bg-white hover:border-slate-300'"
        >
          <div>
            <p class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>{{ method.icon }}</span> {{ method.name }}
            </p>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ method.description || 'Standard delivery' }}
              <span class="text-indigo-600 font-bold ml-1">· +{{ formatCurrency(method.price) }}</span>
            </p>
          </div>
          <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
            :class="idx === 0 ? 'bg-indigo-600' : 'bg-slate-200'">
            <Check v-if="idx === 0" class="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>


    <!-- ══ ADD / EDIT MODAL ══════════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="showModal = false">
        <Transition name="pop">
          <div v-if="showModal" class="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100" @click.stop>

            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 class="text-xl font-bold text-slate-900">
                  {{ editingId ? 'Edit Shipping Method' : 'Add Shipping Method' }}
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ editingId ? 'Update this delivery option.' : 'Add a new delivery option for your customers.' }}
                </p>
              </div>
              <button @click="showModal = false" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Body -->
            <form @submit.prevent="saveMethod" class="p-6 space-y-5">

              <!-- Icon picker -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Icon</label>
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    v-for="emoji in EMOJI_OPTIONS"
                    :key="emoji"
                    type="button"
                    @click="form.icon = emoji"
                    class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition"
                    :class="form.icon === emoji
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <!-- Name -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Method Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="e.g. J&T Express, Vireak Buntham"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition font-medium"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Description</label>
                <input
                  v-model="form.description"
                  type="text"
                  placeholder="e.g. Fast & Reliable, Standard Delivery"
                  class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                />
              </div>

              <!-- Price + ETA -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Price (USD) *</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-3.5 text-slate-400 font-bold text-sm">$</span>
                    <input
                      v-model="form.price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      class="w-full rounded-2xl border border-slate-200 pl-8 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold transition"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Estimated Time</label>
                  <input
                    v-model="form.estimatedDays"
                    type="text"
                    placeholder="e.g. 1-2 days"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                  />
                </div>
              </div>

              <!-- Active toggle -->
              <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p class="text-sm font-bold text-slate-800">Active at Checkout</p>
                  <p class="text-xs text-slate-500 mt-0.5">When off, customers won't see this option.</p>
                </div>
                <button
                  type="button"
                  @click="form.isActive = !form.isActive"
                  class="transition"
                >
                  <ToggleRight v-if="form.isActive" class="w-9 h-9 text-indigo-500" />
                  <ToggleLeft v-else class="w-9 h-9 text-slate-300" />
                </button>
              </div>

              <!-- Footer buttons -->
              <div class="pt-1 flex items-center justify-end gap-3">
                <button type="button" @click="showModal = false"
                  class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition">
                  Cancel
                </button>
                <button type="submit" :disabled="isSaving"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50">
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Check v-else class="w-4 h-4" />
                  {{ isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Method') }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
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
  border-radius: 0.75rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.92) translateY(8px); }
.pop-leave-to   { opacity: 0; transform: scale(0.95); }
</style>
