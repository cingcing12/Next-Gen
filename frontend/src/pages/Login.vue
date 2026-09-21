<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const ui = useUIStore()

const GOOGLE_CLIENT_ID = '461901972919-ksel87duptinf6ojk8g1sdmtfm75ggdl.apps.googleusercontent.com'

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    ui.toast('Please enter your email and password.', 'error')
    return
  }

  isSubmitting.value = true
  try {
    await authStore.login(email.value, password.value)
    ui.toast('Welcome back! Successfully logged in.', 'success')
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Invalid email or password', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleGoogleCredential = async (response) => {
  try {
    await authStore.loginWithGoogle(response.credential)
    ui.toast('Welcome back! Signed in with Google.', 'success')
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (err) {
    ui.toast(err.response?.data?.message || 'Google sign-in failed', 'error')
  }
}

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
      const btnEl = document.getElementById('google-signin-btn')
      if (btnEl) {
        window.google.accounts.id.renderButton(
          btnEl,
          {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'signin_with',
            shape: 'pill'
          }
        )
      }
    }
  }
  document.head.appendChild(script)
})
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

          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4">
            <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
            <span>Secure Customer Portal</span>
          </div>

          <h2 class="text-3xl font-extrabold tracking-tight leading-snug">
            Elevate your personal style with premium essentials.
          </h2>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">
            Join thousands of modern shoppers across Cambodia enjoying seamless Bakong payments and fast delivery.
          </p>
        </div>

        <!-- Trust Badges List -->
        <div class="relative z-10 space-y-3.5 my-8">
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
            <span>Instant Bakong KHQR QR Code verification</span>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
            <span>Fast express delivery to all 25 provinces</span>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-300">
            <div class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 class="w-3.5 h-3.5" />
            </div>
            <span>30-day return policy on all clothing items</span>
          </div>
        </div>

        <!-- Customer Review Quote Card -->
        <div class="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div class="flex items-center gap-1 text-amber-400 mb-1.5">
            <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <p class="text-xs text-slate-300 italic">
            "The fit and fabric quality are unmatched. Paying with Bakong was instant and hassle-free!"
          </p>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[11px] text-slate-400 font-medium">
            <span>Sophea Chem</span>
            <span class="text-emerald-400">Verified Buyer</span>
          </div>
        </div>
      </div>

      <!-- Right Form Panel -->
      <div class="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
        
        <div>
          <!-- Header for Mobile / Brand -->
          <div class="lg:hidden flex items-center justify-between mb-6">
            <router-link to="/" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Sparkles class="w-4 h-4" />
              </div>
              <span class="text-xl font-black text-slate-900">Next-Gen</span>
            </router-link>
            <router-link to="/register" class="text-xs font-bold text-indigo-600 hover:underline">
              Create account →
            </router-link>
          </div>

          <!-- Title & Subtitle -->
          <div class="mb-6 sm:mb-8">
            <h1 class="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              Please enter your details to access your orders and account.
            </p>
          </div>

          <!-- Google One-Tap / GSI Container -->
          <div class="mb-5 sm:mb-6">
            <div class="flex justify-center">
              <div id="google-signin-btn" class="w-full flex justify-center"></div>
            </div>
          </div>

          <!-- Modern Divider -->
          <div class="relative my-5 sm:my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-[10px] sm:text-xs uppercase">
              <span class="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          <!-- Sign In Form -->
          <form class="space-y-3.5 sm:space-y-4" @submit.prevent="handleLogin">
            
            <!-- Email Input -->
            <div>
              <label for="email" class="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 sm:mb-1.5">
                Email Address
              </label>
              <div class="relative rounded-lg sm:rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all bg-slate-50/60 focus-within:bg-white">
                <div class="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="name@example.com"
                  class="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <div class="flex items-center justify-between mb-1 sm:mb-1.5">
                <label for="password" class="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <a href="#" class="text-[10px] sm:text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </a>
              </div>
              <div class="relative rounded-lg sm:rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all bg-slate-50/60 focus-within:bg-white">
                <div class="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  placeholder="Enter your password"
                  class="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center pt-1">
              <input
                id="remember-me"
                v-model="rememberMe"
                type="checkbox"
                class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label for="remember-me" class="ml-2 block text-[10px] sm:text-xs font-medium text-slate-600 cursor-pointer">
                Keep me signed in on this device
              </label>
            </div>

            <!-- Submit Button -->
            <div class="pt-1.5 sm:pt-2">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <template v-if="isSubmitting">
                  <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </template>
                <template v-else>
                  <span>Sign In to Account</span>
                  <ArrowRight class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </template>
              </button>
            </div>

          </form>
        </div>

        <!-- Footer Switch to Register -->
        <div class="mt-8 pt-6 border-t border-slate-100 text-center">
          <p class="text-sm text-slate-600">
            Don't have an account yet?
            <router-link to="/register" class="font-bold text-indigo-600 hover:text-indigo-700 ml-1">
              Create an account for free
            </router-link>
          </p>
        </div>

      </div>

    </div>

  </div>
</template>
