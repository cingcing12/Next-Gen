<script setup>
import { useUIStore } from '../stores/ui'
import { HelpCircle, AlertTriangle } from 'lucide-vue-next'

const ui = useUIStore()

const handleConfirm = () => {
  ui.resolveConfirm(true)
}

const handleCancel = () => {
  ui.resolveConfirm(false)
}

const isDanger = () => ui.confirmDialog.type === 'danger'
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="ui.confirmDialog.isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="handleCancel"></div>
      
      <!-- Dialog -->
      <Transition
        enter-active-class="transition duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75"
        enter-from-class="opacity-0 translate-y-12 scale-90"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-8 scale-95"
      >
        <div v-if="ui.confirmDialog.isOpen" class="relative bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-8 max-w-xs sm:max-w-sm w-full overflow-hidden border border-slate-100">
          
          <!-- Top Gradient Border -->
          <div :class="[
            'absolute top-0 left-0 w-full h-1.5',
            isDanger() ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          ]"></div>
          
          <div class="flex flex-col items-center text-center mt-2">
            <!-- Glowing Icon Container -->
            <div :class="[
              'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 relative',
              isDanger() ? 'bg-rose-50' : 'bg-indigo-50'
            ]">
              <div :class="[
                'absolute inset-0 rounded-full animate-ping opacity-20',
                isDanger() ? 'bg-rose-400' : 'bg-indigo-400'
              ]"></div>
              
              <div :class="[
                'w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center relative z-10 shadow-inner',
                isDanger() ? 'bg-gradient-to-br from-rose-100 to-rose-50' : 'bg-gradient-to-br from-indigo-100 to-indigo-50'
              ]">
                <component :is="isDanger() ? AlertTriangle : HelpCircle" :class="[
                  'w-6 h-6 sm:w-8 sm:h-8',
                  isDanger() ? 'text-rose-600 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]'
                ]" />
              </div>
            </div>
            
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight">{{ ui.confirmDialog.title }}</h3>
            <p v-if="ui.confirmDialog.message" class="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 leading-relaxed font-medium px-2">{{ ui.confirmDialog.message }}</p>
            <div v-else class="mb-6 sm:mb-8"></div>
            
            <div class="flex space-x-3 w-full">
              <button @click="handleCancel" class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300">
                Cancel
              </button>
              <button @click="handleConfirm" :class="[
                'flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                isDanger() ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 focus:ring-rose-500' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 focus:ring-indigo-500'
              ]">
                {{ isDanger() ? 'Delete' : 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
