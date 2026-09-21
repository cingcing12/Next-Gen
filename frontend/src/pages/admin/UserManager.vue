<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Search, Edit2, Trash2, ShieldOff, ShieldCheck, ShieldAlert,
  Plus, X, Users, UserCheck, UserX, Crown, User2,
  Mail, Phone, Send, Calendar, Loader2, RefreshCw, Eye
} from 'lucide-vue-next'
import { useUserStore } from '../../stores/user'
import { useUIStore } from '../../stores/ui'

const userStore = useUserStore()
const ui = useUIStore()

const showModal = ref(false)
const selectedUser = ref(null)   // detail panel
const searchQuery = ref('')
const activeFilter = ref('all')  // all | admin | active | blocked
const togglingId = ref(null)
const isSaving = ref(false)

const form = ref({ fullName: '', email: '', phone: '', telegram: '', role: 'user', password: '' })

onMounted(() => {
  userStore.fetchUsers()
  window.addEventListener('system:user_updated', userStore.fetchUsers)
  window.addEventListener('system:user_deleted', userStore.fetchUsers)
})

onUnmounted(() => {
  window.removeEventListener('system:user_updated', userStore.fetchUsers)
  window.removeEventListener('system:user_deleted', userStore.fetchUsers)
})

// ── Filters ────────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  let list = [...userStore.users]

  if (activeFilter.value === 'admin')   list = list.filter(u => u.isAdmin || u.role === 'admin')
  else if (activeFilter.value === 'active')  list = list.filter(u => !u.isBlocked)
  else if (activeFilter.value === 'blocked') list = list.filter(u => u.isBlocked)

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(u =>
      (u.name || u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    )
  }
  return list
})

const counts = computed(() => ({
  all:     userStore.users.length,
  admin:   userStore.users.filter(u => u.isAdmin || u.role === 'admin').length,
  active:  userStore.users.filter(u => !u.isBlocked).length,
  blocked: userStore.users.filter(u => u.isBlocked).length,
}))

const TABS = [
  { key: 'all',     label: 'All Users' },
  { key: 'admin',   label: 'Admins' },
  { key: 'active',  label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
]

// ── Actions ────────────────────────────────────────────────────────────────
const toggleBlock = async (user) => {
  togglingId.value = user._id
  try {
    await userStore.toggleBlockUser(user._id)
    // Update detail panel if open
    if (selectedUser.value?._id === user._id) {
      selectedUser.value = { ...selectedUser.value, isBlocked: !selectedUser.value.isBlocked }
    }
    ui.toast(user.isBlocked ? 'User unblocked ✓' : 'User blocked', user.isBlocked ? 'success' : 'warning')
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Failed to update status', 'error')
  } finally {
    togglingId.value = null
  }
}

const deleteUser = async (id) => {
  if (await ui.confirm('Delete User', 'This will permanently remove the user account.', 'danger')) {
    try {
      await userStore.deleteUser(id)
      if (selectedUser.value?._id === id) selectedUser.value = null
      ui.toast('User removed', 'success')
    } catch (err) {
      ui.toast(err || 'Failed to delete user', 'error')
    }
  }
}

const selectedUserForEdit = ref(null)

const openAddModal = () => {
  selectedUserForEdit.value = null
  form.value = { fullName: '', email: '', phone: '', telegram: '', role: 'user', password: '' }
  showModal.value = true
}

const openEditModal = (user) => {
  selectedUserForEdit.value = user
  form.value = { 
    fullName: user.fullName || user.name || '', 
    email: user.email || '', 
    phone: user.phone || '', 
    telegram: user.telegramUsername || user.telegram || '', 
    role: isAdmin(user) ? 'admin' : 'user', 
    password: '' 
  }
  showModal.value = true
}

const saveUser = async () => {
  isSaving.value = true
  try {
    if (selectedUserForEdit.value) {
      await userStore.updateUser(selectedUserForEdit.value._id, {
        name: form.value.fullName,
        email: form.value.email,
        password: form.value.password || undefined,
        phone: form.value.phone,
        telegram: form.value.telegram,
        role: form.value.role,
      })
      ui.toast('User updated! ✓', 'success')
      // Update selectedUser if it's currently being viewed in the panel
      if (selectedUser.value?._id === selectedUserForEdit.value._id) {
        selectedUser.value = { ...selectedUser.value, ...form.value, fullName: form.value.fullName, telegramUsername: form.value.telegram }
      }
    } else {
      await userStore.createUser({
        fullName: form.value.fullName,
        email: form.value.email,
        password: form.value.password,
        phone: form.value.phone,
        telegramUsername: form.value.telegram,
        role: form.value.role,
      })
      ui.toast('User created! ✓', 'success')
    }
    showModal.value = false
    form.value = { fullName: '', email: '', phone: '', telegram: '', role: 'user', password: '' }
  } catch (err) {
    ui.toast(err || 'Failed to save user', 'error')
  } finally {
    isSaving.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const getUserName = (u) => u.name || u.fullName || u.email?.split('@')[0] || 'User'
const getUserInitial = (u) => getUserName(u).charAt(0).toUpperCase()
const isAdmin = (u) => u.isAdmin || u.role === 'admin'

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-indigo-500',
]
const avatarColor = (u) => AVATAR_COLORS[(u._id?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 relative">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users class="w-8 h-8 text-indigo-600" />
          <span>User Management</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Manage accounts, roles, and access.
          <span class="font-semibold text-indigo-600">{{ userStore.users.length }}</span> registered users.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="userStore.fetchUsers()"
          :disabled="userStore.loading"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-sm font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': userStore.loading }" />
          Refresh
        </button>
        <button
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus class="w-5 h-5" />
          Add User
        </button>
      </div>
    </div>

    <!-- ── Stat Pills ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Total</p>
          <p class="text-xl font-black text-slate-900">{{ counts.all }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
          <Crown class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Admins</p>
          <p class="text-xl font-black text-slate-900">{{ counts.admin }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <UserCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Active</p>
          <p class="text-xl font-black text-slate-900">{{ counts.active }}</p>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
          <UserX class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[11px] font-bold uppercase text-slate-400">Blocked</p>
          <p class="text-xl font-black text-slate-900">{{ counts.blocked }}</p>
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
            placeholder="Search name, email, phone..."
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
        </div>

        <!-- Filter tabs -->
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
            >{{ counts[tab.key] }}</span>
          </button>
        </div>

        <span class="text-xs text-slate-400 font-medium ml-auto whitespace-nowrap">
          {{ filteredUsers.length }} users
        </span>
      </div>

      <!-- Loading skeleton -->
      <template v-if="userStore.loading">
        <div class="divide-y divide-slate-50">
          <div v-for="i in 4" :key="i" class="flex items-center gap-5 px-6 py-4">
            <div class="skeleton w-11 h-11 rounded-full flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="skeleton h-4 w-32"></div>
              <div class="skeleton h-3 w-48"></div>
            </div>
            <div class="skeleton h-6 w-16 rounded-full hidden sm:block"></div>
            <div class="skeleton h-6 w-14 rounded-full hidden sm:block"></div>
            <div class="skeleton h-8 w-24 rounded-xl ml-auto"></div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="filteredUsers.length === 0" class="p-16 text-center">
        <div class="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Users class="w-10 h-10 text-slate-300" />
        </div>
        <p class="font-bold text-slate-700">No users found</p>
        <p class="text-xs text-slate-400 mt-1">Try a different filter or search term.</p>
      </div>

      <!-- User Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-[11px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/30">
            <tr>
              <th class="py-3.5 px-6">User</th>
              <th class="py-3.5 px-6 hidden md:table-cell">Contact</th>
              <th class="py-3.5 px-6">Role</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6 hidden sm:table-cell">Joined</th>
              <th class="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="user in filteredUsers"
              :key="user._id"
              @click="selectedUser = user"
              class="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
            >
              <!-- User info -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.image && !user.image.includes('via.placeholder')"
                    :src="user.image"
                    class="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-200"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-tr text-white font-bold text-sm flex items-center justify-center uppercase shadow-sm flex-shrink-0"
                    :class="avatarColor(user)"
                  >
                    {{ getUserInitial(user) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="font-semibold text-slate-900">{{ getUserName(user) }}</p>
                      <Crown v-if="isAdmin(user)" class="w-3 h-3 text-amber-500" />
                    </div>
                    <p class="text-[11px] text-slate-400">{{ user.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td class="py-4 px-6 hidden md:table-cell">
                <p class="text-xs text-slate-700">{{ user.phone || '—' }}</p>
                <p class="text-[10px] text-slate-400">{{ user.telegram ? `@${user.telegram}` : '' }}</p>
              </td>

              <!-- Role badge -->
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  :class="isAdmin(user)
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'"
                >
                  <Crown v-if="isAdmin(user)" class="w-2.5 h-2.5" />
                  <User2 v-else class="w-2.5 h-2.5" />
                  {{ isAdmin(user) ? 'Admin' : 'Customer' }}
                </span>
              </td>

              <!-- Status badge -->
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  :class="user.isBlocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="user.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                  {{ user.isBlocked ? 'Blocked' : 'Active' }}
                </span>
              </td>

              <!-- Joined date -->
              <td class="py-4 px-6 hidden sm:table-cell text-xs text-slate-500">
                {{ formatDate(user.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="py-4 px-6 text-right" @click.stop>
                <div class="flex items-center justify-end gap-2">
                  <!-- Block/Unblock -->
                  <button
                    @click.stop="toggleBlock(user)"
                    :disabled="togglingId === user._id"
                    :title="user.isBlocked ? 'Unblock user' : 'Block user'"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition disabled:opacity-50"
                    :class="user.isBlocked
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'"
                  >
                    <Loader2 v-if="togglingId === user._id" class="w-3 h-3 animate-spin" />
                    <ShieldCheck v-else-if="user.isBlocked" class="w-3 h-3" />
                    <ShieldOff v-else class="w-3 h-3" />
                    {{ user.isBlocked ? 'Unblock' : 'Block' }}
                  </button>

                  <!-- Edit user -->
                  <button
                    @click.stop="openEditModal(user)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition"
                    title="Edit user"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- View detail -->
                  <button
                    @click.stop="selectedUser = user"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition"
                    title="View details"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Delete -->
                  <button
                    @click.stop="deleteUser(user._id)"
                    class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition"
                    title="Delete user"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ USER DETAIL SLIDE-OVER ════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="selectedUser" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" @click="selectedUser = null"></div>
    </Transition>

    <Transition name="slide">
      <div v-if="selectedUser" class="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col" @click.stop>

        <!-- Panel header -->
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">User Profile</p>
            <h3 class="text-lg font-black text-slate-900 mt-0.5">{{ getUserName(selectedUser) }}</h3>
          </div>
          <button @click="selectedUser = null" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Panel body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Avatar + name block -->
          <div class="flex flex-col items-center text-center py-4">
            <img
              v-if="selectedUser.image && !selectedUser.image.includes('via.placeholder')"
              :src="selectedUser.image"
              class="w-20 h-20 rounded-3xl object-cover shadow-xl mb-4 border border-slate-200"
            />
            <div
              v-else
              class="w-20 h-20 rounded-3xl bg-gradient-to-tr text-white font-black text-2xl flex items-center justify-center uppercase shadow-xl mb-4"
              :class="avatarColor(selectedUser)"
            >
              {{ getUserInitial(selectedUser) }}
            </div>
            <div class="flex items-center gap-2 mb-1">
              <h4 class="text-xl font-black text-slate-900">{{ getUserName(selectedUser) }}</h4>
              <Crown v-if="isAdmin(selectedUser)" class="w-4 h-4 text-amber-500" />
            </div>
            <p class="text-sm text-slate-500">{{ selectedUser.email }}</p>
            <div class="flex items-center gap-2 mt-3">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                :class="isAdmin(selectedUser) ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-600 border-slate-200'"
              >
                <Crown v-if="isAdmin(selectedUser)" class="w-3 h-3" />
                <User2 v-else class="w-3 h-3" />
                {{ isAdmin(selectedUser) ? 'Admin' : 'Customer' }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                :class="selectedUser.isBlocked ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="selectedUser.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                {{ selectedUser.isBlocked ? 'Blocked' : 'Active' }}
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-3">
            <button
              @click="toggleBlock(selectedUser)"
              :disabled="togglingId === selectedUser._id"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition disabled:opacity-50"
              :class="selectedUser.isBlocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-emerald-600'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 border-rose-600'"
            >
              <Loader2 v-if="togglingId === selectedUser._id" class="w-4 h-4 animate-spin" />
              <ShieldCheck v-else-if="selectedUser.isBlocked" class="w-4 h-4" />
              <ShieldOff v-else class="w-4 h-4" />
              {{ selectedUser.isBlocked ? 'Unblock User' : 'Block User' }}
            </button>
            <button
              @click="deleteUser(selectedUser._id)"
              class="w-12 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- User Details -->
          <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Info</p>
            <div class="space-y-2.5 text-sm">
              <div class="flex items-center gap-2.5">
                <Mail class="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span class="text-slate-700 break-all">{{ selectedUser.email || '—' }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <Phone class="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span class="text-slate-700">{{ selectedUser.phone || '—' }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <Send class="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span class="text-slate-700">{{ selectedUser.telegram ? `@${selectedUser.telegram}` : '—' }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <Calendar class="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span class="text-slate-700">Joined {{ formatDate(selectedUser.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- ID block -->
          <div class="bg-slate-900 rounded-2xl p-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">User ID</p>
            <p class="font-mono text-xs text-slate-300 break-all">{{ selectedUser._id }}</p>
          </div>

        </div>
      </div>
    </Transition>


    <!-- ══ ADD USER MODAL ════════════════════════════════════════════════════ -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="showModal = false">
        <Transition name="pop">
          <div v-if="showModal" class="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100" @click.stop>

            <!-- Modal header -->
            <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 class="text-xl font-bold text-slate-900">{{ selectedUserForEdit ? 'Edit User' : 'Create New User' }}</h2>
                <p class="text-xs text-slate-500 mt-0.5">{{ selectedUserForEdit ? 'Update user details and roles.' : 'Add a new user account to the system.' }}</p>
              </div>
              <button @click="showModal = false" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal body -->
            <form @submit.prevent="saveUser" class="p-6 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Full Name *</label>
                  <input v-model="form.fullName" type="text" required placeholder="e.g. Sophea Chem"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email *</label>
                  <input v-model="form.email" type="email" required placeholder="user@example.com"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone</label>
                  <input v-model="form.phone" type="text" placeholder="+855 12 345 678"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Telegram</label>
                  <input v-model="form.telegram" type="text" placeholder="@username"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Role</label>
                  <select v-model="form.role"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition bg-white font-medium">
                    <option value="user">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Password <span v-if="!selectedUserForEdit">*</span>
                  </label>
                  <input v-model="form.password" type="password" :required="!selectedUserForEdit" :placeholder="selectedUserForEdit ? 'Leave blank to keep unchanged' : 'Min 6 characters'"
                    class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition" />
                </div>
              </div>

              <div class="pt-2 flex items-center justify-end gap-3">
                <button type="button" @click="showModal = false"
                  class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition">
                  Cancel
                </button>
                <button type="submit" :disabled="isSaving"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50">
                  <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                  <Edit2 v-else-if="selectedUserForEdit" class="w-4 h-4" />
                  <Plus v-else class="w-4 h-4" />
                  {{ isSaving ? 'Saving...' : (selectedUserForEdit ? 'Update User' : 'Create User') }}
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
  border-radius: 0.5rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.92) translateY(8px); }
.pop-leave-to   { opacity: 0; transform: scale(0.95); }
</style>
