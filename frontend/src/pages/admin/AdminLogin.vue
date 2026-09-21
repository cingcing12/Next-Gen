<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import {
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const ui = useUIStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    ui.toast('Please enter your email and password.', 'error')
    return
  }

  try {
    isLoading.value = true
    await authStore.login(email.value, password.value)
    if (authStore.isAdmin) {
      ui.toast('Admin access granted.', 'success')
      router.push('/admin')
    } else {
      ui.toast('Access denied. You must be an administrator.', 'error')
      authStore.logout() // Force logout if they logged in but aren't admin
    }
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Invalid email or password', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
    
    <!-- Ambient Background Lighting Orbs -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
      
      <!-- Left Visual Hero Brand Panel (Desktop only) -->
      <div class="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-10 flex-col justify-between relative overflow-hidden">
        <!-- Subtle Pattern / Gradient Highlights -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10">
          <router-link to="/" class="inline-flex items-center gap-2.5 group mb-8">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles class="w-5 h-5 text-white" />
            </div>
            <span class="text-2xl font-black tracking-tight text-white">Next-Gen</span>
          </router-link>

          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 mb-4">
            <ShieldCheck class="w-3.5 h-3.5 text-red-400" />
            <span>Secure Admin Portal</span>
          </div>

          <h2 class="text-3xl font-extrabold tracking-tight leading-snug">
            System Administration & Control Center.
          </h2>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">
            Manage your storefront, review orders, and monitor your platform's success from a centralized secure location.
          </p>
        </div>

        <!-- Trust Badges List -->
        <div class="relative z-10 space-y-3.5 my-8">
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <div class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
            <span>End-to-end encrypted authentication</span>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <div class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
            <span>Real-time platform analytics</span>
          </div>
        </div>

      </div>

      <!-- Right Form Panel -->
      <div class="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
        
        <div class="w-full max-w-md mx-auto">
          <!-- Header for Mobile / Brand -->
          <div class="lg:hidden flex items-center justify-between mb-6">
            <router-link to="/" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Sparkles class="w-4 h-4" />
              </div>
              <span class="text-xl font-black text-slate-900">Next-Gen</span>
            </router-link>
          </div>

          <!-- Title & Subtitle -->
          <div class="mb-8">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Access
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              Enter your administrative credentials to continue.
            </p>
          </div>

          <!-- Sign In Form -->
          <form class="space-y-5" @submit.prevent="handleLogin">
            
            <!-- Email Input -->
            <div>
              <label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Admin Email
              </label>
              <div class="relative rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all bg-slate-50/60 focus-within:bg-white">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="admin@next-gen.com"
                  class="w-full pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Security Key
                </label>
              </div>
              <div class="relative rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all bg-slate-50/60 focus-within:bg-white">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  placeholder="••••••••"
                  class="w-full pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
              <span>{{ isLoading ? 'Authenticating...' : 'Sign In as Admin' }}</span>
              <ArrowRight v-if="!isLoading" class="w-4 h-4" />
            </button>

          </form>

          <div class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <router-link to="/" class="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
              &larr; Return to Storefront
            </router-link>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
