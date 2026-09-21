<script setup>
import { useUIStore } from '../stores/ui'
import { CheckCircle2, AlertOctagon, Info, X } from 'lucide-vue-next'

const ui = useUIStore()

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return AlertOctagon
    default: return Info
  }
}

const getContainerClass = (type) => {
  switch (type) {
    case 'success': return 'bg-white/95 backdrop-blur-xl border border-emerald-100 shadow-[0_12px_40px_-10px_rgba(16,185,129,0.2)]'
    case 'error': return 'bg-white/95 backdrop-blur-xl border border-rose-100 shadow-[0_12px_40px_-10px_rgba(244,63,94,0.2)]'
    default: return 'bg-white/95 backdrop-blur-xl border border-blue-100 shadow-[0_12px_40px_-10px_rgba(59,130,246,0.2)]'
  }
}

const getIconBoxClass = (type) => {
  switch (type) {
    case 'success': return 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2),0_0_15px_rgba(16,185,129,0.3)]'
    case 'error': return 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.2),0_0_15px_rgba(244,63,94,0.3)]'
    default: return 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2),0_0_15px_rgba(59,130,246,0.3)]'
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 sm:top-6 sm:bottom-auto sm:right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
    <TransitionGroup 
      enter-active-class="transition duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="transform translate-y-8 sm:translate-y-0 sm:translate-x-12 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 sm:translate-x-0 opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in absolute w-full"
      leave-from-class="transform translate-y-0 sm:translate-x-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-8 sm:translate-y-0 sm:translate-x-12 opacity-0 scale-95"
      move-class="transition duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <div 
        v-for="toast in ui.toasts" 
        :key="toast.id"
        :class="['pointer-events-auto flex items-start p-4 rounded-2xl min-w-[320px] max-w-sm relative overflow-hidden group', getContainerClass(toast.type)]"
      >
        <!-- Icon -->
        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mr-4', getIconBoxClass(toast.type)]">
          <component :is="getIcon(toast.type)" class="w-5 h-5" />
        </div>
        
        <!-- Content -->
        <div class="flex-grow pt-0.5">
          <h4 class="text-sm font-bold text-slate-900 leading-tight mb-1">
            {{ toast.type === 'success' ? 'Success!' : toast.type === 'error' ? 'Oops!' : 'Notification' }}
          </h4>
          <p class="font-medium text-xs text-slate-500 leading-relaxed">{{ toast.message }}</p>
        </div>
        
        <!-- Close Button -->
        <button @click="ui.removeToast(toast.id)" class="ml-4 flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none">
          <X class="w-4 h-4" />
        </button>

        <!-- Progress Bar -->
        <div class="absolute bottom-0 left-0 h-1 w-full bg-slate-100/50">
          <div :class="['h-full progress-bar', toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500']"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.progress-bar {
  animation: shrink 3s linear forwards;
}
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
