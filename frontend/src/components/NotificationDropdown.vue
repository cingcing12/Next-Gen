<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Check, Package, Info, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notification'
import { storeToRefs } from 'pinia'
import { formatDistanceToNow } from 'date-fns'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, unreadCount } = storeToRefs(notificationStore)

const isOpen = ref(false)
const dropdownRef = ref(null)

onMounted(() => {
  notificationStore.fetchNotifications()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    notificationStore.fetchNotifications()
  }
}

const handleNotificationClick = (notification) => {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification._id)
  }
  isOpen.value = false
  if (notification.link) {
    router.push(notification.link)
  }
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

const getIcon = (type) => {
  switch (type) {
    case 'order': return Package
    case 'success': return CheckCircle2
    case 'warning': return AlertTriangle
    default: return Info
  }
}

const getIconColorClass = (type) => {
  switch (type) {
    case 'order': return 'text-indigo-500 bg-indigo-50'
    case 'success': return 'text-emerald-500 bg-emerald-50'
    case 'warning': return 'text-amber-500 bg-amber-50'
    default: return 'text-blue-500 bg-blue-50'
  }
}
</script>

<template>
  <div class="relative flex items-center justify-center" ref="dropdownRef">
    <!-- Bell Button -->
    <button 
      @click="toggleDropdown"
      class="relative flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors duration-200 focus:outline-none cursor-pointer"
    >
      <Bell class="w-5 h-5" />
      <!-- Unread Badge -->
      <span 
        v-if="unreadCount > 0" 
        class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"
      ></span>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="absolute right-[-10px] sm:right-0 top-full mt-4 w-[280px] sm:w-80 md:w-96 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden z-50 transform origin-top-right"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 class="text-sm sm:text-base font-bold text-slate-900">Notifications</h3>
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="text-[10px] sm:text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Mark all read
          </button>
        </div>

        <!-- Notification List -->
        <div class="max-h-80 sm:max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="p-6 sm:p-8 text-center text-slate-500 flex flex-col items-center">
            <Bell class="w-8 h-8 sm:w-10 sm:h-10 text-slate-200 mb-2" />
            <p class="text-xs sm:text-sm">No notifications yet</p>
          </div>

          <div 
            v-for="notification in notifications" 
            :key="notification._id"
            @click="handleNotificationClick(notification)"
            class="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative"
            :class="{ 'bg-indigo-50/30': !notification.isRead }"
          >
            <!-- Unread Dot -->
            <div v-if="!notification.isRead" class="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-indigo-500"></div>
            
            <div class="flex gap-2 sm:gap-3 ml-1 sm:ml-2">
              <div :class="['flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center', getIconColorClass(notification.type)]">
                <component :is="getIcon(notification.type)" class="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {{ notification.title }}
                </p>
                <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {{ notification.message }}
                </p>
                <p class="text-[9px] sm:text-[10px] text-slate-400 mt-1">
                  {{ notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
