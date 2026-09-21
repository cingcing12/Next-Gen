<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, MapPin, Check, Truck } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { useShippingStore } from '../stores/shipping'
import api from '../api/axios'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const ui = useUIStore()
const shippingStore = useShippingStore()

const form = ref({
  fullName: authStore.user?.fullName || '',
  phone: authStore.user?.phone || '',
  address: authStore.user?.address || '',
  location: authStore.user?.location || '',
  telegramUsername: authStore.user?.telegramUsername || '',
  deliveryCompany: ''
})

// ── Load active shipping methods from backend ──────────────────────────────
const shippingLoading = ref(false)
const selectedMethod = ref(null)  // full method object

onMounted(async () => {
  shippingLoading.value = true
  try {
    const methods = await shippingStore.fetchActiveMethods()
    if (methods && methods.length > 0) {
      selectedMethod.value = methods[0]
      form.value.deliveryCompany = methods[0].name
    }
  } catch {
    // fallback silently
  } finally {
    shippingLoading.value = false
  }
})

const selectShipping = (method) => {
  selectedMethod.value = method
  form.value.deliveryCompany = method.name
}

const checkoutStep = ref(1)
const bakongQrImageUrl = ref(null)
const bakongMd5 = ref(null)
const currentOrderId = ref(null)
const finalPaidAmount = ref(0)
const orderPlaced = ref(false)
const placingOrder = ref(false)
const orderError = ref('')

// Countdown timer
const countdown = ref(300) // 5 minutes in seconds
let countdownInterval = null
let pollInterval = null

const countdownFormatted = computed(() => {
  const m = Math.floor(countdown.value / 60).toString().padStart(2, '0')
  const s = (countdown.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const shippingCost = computed(() => selectedMethod.value?.price ?? 0)
const orderTotal = computed(() => cartStore.totalPrice + shippingCost.value)

const clearTimers = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (pollInterval) clearInterval(pollInterval)
  countdownInterval = null
  pollInterval = null
}

onUnmounted(() => clearTimers())

// Step 1: Create the order in backend, then generate real Bakong QR
const proceedToPayment = async () => {
  if (!form.value.fullName || !form.value.phone || !form.value.address || !form.value.telegramUsername) {
    ui.toast('Please fill in all required fields.', 'error')
    return
  }

  placingOrder.value = true
  orderError.value = ''

  try {
    // 1. Create the pending order in database (or reuse existing if retry)
    let orderId = currentOrderId.value
    if (!orderId) {
      const orderData = {
        orderItems: cartStore.items.map(item => ({
          product: item.product?._id || item.product || item.id,
          name: item.name,
          image: item.image || 'https://via.placeholder.com/150',
          price: item.price,
          qty: item.qty,
          size: item.size || '',
          color: item.color || ''
        })),
        shippingAddress: {
          fullName: form.value.fullName,
          phone: form.value.phone,
          address: form.value.address,
          location: form.value.location || '',
          telegramUsername: form.value.telegramUsername,
          city: 'Phnom Penh',
          postalCode: '00000',
          country: 'Cambodia'
        },
        paymentMethod: 'bakong',
        deliveryCompany: form.value.deliveryCompany,
        itemsPrice: cartStore.totalPrice,
        taxPrice: 0,
        shippingPrice: shippingCost.value,
        totalPrice: orderTotal.value
      }

      const orderRes = await api.post('/orders', orderData)
      orderId = orderRes.data._id
      currentOrderId.value = orderId
    }

    // 2. Generate real Bakong KHQR using the order ID
    const bakongRes = await api.post('/bakong/generate', {
      orderId: orderId,
      amount: orderTotal.value
    })

    const { qrImage, md5 } = bakongRes.data
    bakongMd5.value = md5

    // Use the base64 QR image returned directly from backend
    bakongQrImageUrl.value = qrImage

    // 4. Go to QR step and start timers
    checkoutStep.value = 2
    startCountdown()
    startPolling()

  } catch (error) {
    orderError.value = error.response?.data?.message || 'Failed to initiate payment. Please try again.'
    ui.toast(orderError.value, 'error')
  } finally {
    placingOrder.value = false
  }
}

const startCountdown = () => {
  countdown.value = 300
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearTimers()
      ui.toast('QR Code expired. Please try again.', 'error')
      checkoutStep.value = 1
    }
  }, 1000)
}

const startPolling = () => {
  pollInterval = setInterval(async () => {
    try {
      const res = await api.post('/bakong/check', {
        md5: bakongMd5.value,
        orderId: currentOrderId.value
      })
      if (res.data.success) {
        clearTimers()
        finalPaidAmount.value = orderTotal.value
        cartStore.clearCart()
        orderPlaced.value = true
      }
      // success: false = not paid yet, keep polling silently
    } catch (err) {
      // network error — keep polling silently
    }
  }, 5000)
}

const cancelPayment = () => {
  clearTimers()
  checkoutStep.value = 1
  bakongQrImageUrl.value = null
}
</script>

<template>
  <div class="bg-slate-50 min-h-screen py-12 relative overflow-hidden">
    <!-- Decorative background blobs -->
    <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <h1 class="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6 sm:mb-10 text-center lg:text-left">Secure Checkout</h1>
      
      <div class="lg:grid lg:grid-cols-12 lg:gap-x-12">
        <!-- Main Form / Payment Area -->
        <div class="lg:col-span-7 xl:col-span-8 relative">
          
          <transition name="slide-fade" mode="out-in">
            <!-- ══ ORDER SUCCESS CELEBRATION ══ -->
            <div v-if="orderPlaced" class="relative overflow-hidden">

              <!-- Confetti particles -->
              <div class="confetti-container pointer-events-none" aria-hidden="true">
                <span v-for="i in 30" :key="i" class="confetti-dot"
                  :style="{
                    '--x': `${Math.random() * 100}%`,
                    '--delay': `${Math.random() * 0.8}s`,
                    '--dur': `${0.8 + Math.random() * 1}s`,
                    '--color': ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ec4899','#3b82f6'][i % 6],
                    '--rot': `${Math.random() * 720 - 360}deg`,
                    left: `${Math.random() * 100}%`,
                  }"
                ></span>
              </div>

              <!-- Main card -->
              <div class="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-100/60 border border-white/80 p-5 sm:p-8 md:p-12 text-center relative z-10">

                <!-- Success ring + icon -->
                <div class="relative inline-flex items-center justify-center mb-6 sm:mb-8">
                  <!-- Outer pulse rings -->
                  <span class="absolute w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-emerald-400/10 animate-ping-slow"></span>
                  <span class="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-emerald-400/15 animate-ping-slow" style="animation-delay:0.3s"></span>
                  <!-- Rotating sparkle ring -->
                  <span class="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[3px] sm:border-4 border-dashed border-emerald-300/60 animate-spin-slow"></span>
                  <!-- Main circle -->
                  <div class="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-pop z-10">
                    <Check class="w-8 h-8 sm:w-12 sm:h-12 text-white stroke-[3]" />
                  </div>
                </div>

                <!-- Staggered text -->
                <div class="animate-rise" style="animation-delay:0.15s">
                  <div class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
                    <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Payment Confirmed
                  </div>
                </div>

                <h2 class="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight animate-rise" style="animation-delay:0.25s">Order Confirmed! 🎉</h2>

                <p class="text-xs sm:text-base text-slate-500 mt-2 sm:mt-3 mb-4 sm:mb-6 max-w-sm mx-auto leading-relaxed animate-rise" style="animation-delay:0.35s">
                  Thank you for shopping with <span class="font-bold text-indigo-600">Next-Gen</span>. Your order is confirmed and being prepared for delivery.
                </p>

                <!-- Order info strip -->
                <div class="animate-rise" style="animation-delay:0.45s">
                  <div class="grid grid-cols-3 gap-1.5 sm:gap-3 bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-5 sm:mb-8 border border-slate-100">
                    <div class="text-center">
                      <p class="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Status</p>
                      <p class="text-[10px] sm:text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                        <span class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 inline-block"></span> Paid
                      </p>
                    </div>
                    <div class="text-center border-x border-slate-200">
                      <p class="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Delivery</p>
                      <p class="text-[10px] sm:text-sm font-bold text-slate-700 truncate px-1">{{ form.deliveryCompany || 'Standard' }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:mb-1">Total Paid</p>
                      <p class="text-[10px] sm:text-sm font-bold text-indigo-600">${{ finalPaidAmount.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Progress steps -->
                <div class="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 animate-rise" style="animation-delay:0.55s">
                  <div v-for="(step, i) in ['Order Placed','Processing','Shipped','Delivered']" :key="i"
                    class="flex items-center gap-1 sm:gap-2">
                    <div class="flex flex-col items-center">
                      <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black"
                        :class="i === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400'">
                        <Check v-if="i === 0" class="w-3 h-3 sm:w-4 sm:h-4" />
                        <span v-else>{{ i + 1 }}</span>
                      </div>
                      <p class="text-[8px] sm:text-[9px] font-bold text-center mt-1 whitespace-nowrap"
                        :class="i === 0 ? 'text-emerald-600' : 'text-slate-400'">{{ step }}</p>
                    </div>
                    <div v-if="i < 3" class="w-4 sm:w-10 h-0.5 mb-3 sm:mb-4"
                      :class="i === 0 ? 'bg-emerald-300' : 'bg-slate-200'"></div>
                  </div>
                </div>

                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 animate-rise" style="animation-delay:0.65s">
                  <button
                    @click="router.push('/profile')"
                    class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-base font-bold transition-all hover:-translate-y-0.5"
                  >
                    View My Orders
                  </button>
                  <button
                    @click="router.push('/')"
                    class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-base font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all"
                  >
                    Continue Shopping →
                  </button>
                </div>

              </div>
            </div>

            <!-- Step 1: Information -->
            <div v-else-if="checkoutStep === 1" class="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-5 md:p-10">
              <div class="flex items-center gap-3 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-100">
                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin class="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Shipping Details</h2>
              </div>
              
              <form class="space-y-4 sm:space-y-7" @submit.prevent="proceedToPayment">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div class="relative group">
                    <label class="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Full Name <span class="text-red-500">*</span></label>
                    <input v-model="form.fullName" type="text" required class="w-full rounded-xl sm:rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-base border transition-all duration-300 outline-none" placeholder="e.g. John Doe" />
                  </div>
                  <div class="relative group">
                    <label class="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Phone Number <span class="text-red-500">*</span></label>
                    <input v-model="form.phone" type="tel" required class="w-full rounded-xl sm:rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-base border transition-all duration-300 outline-none" placeholder="e.g. 012 345 678" />
                  </div>
                </div>

                <div class="relative group">
                  <label class="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Telegram Username <span class="text-red-500">*</span></label>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 sm:left-4 text-slate-400 font-bold text-xs sm:text-base">@</span>
                    <input v-model="form.telegramUsername" type="text" required class="w-full pl-8 sm:pl-10 rounded-xl sm:rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 py-2.5 sm:py-3.5 pr-3 sm:pr-4 text-xs sm:text-base border transition-all duration-300 outline-none" placeholder="username" />
                  </div>
                </div>

                <div class="relative group">
                  <label class="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Full Address <span class="text-red-500">*</span></label>
                  <textarea v-model="form.address" rows="3" required class="w-full rounded-xl sm:rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-base border transition-all duration-300 outline-none resize-none" placeholder="House #, Street, Sangkat, Khan, City..."></textarea>
                </div>
                
                <div class="relative group">
                  <label class="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">Location (Optional Link)</label>
                  <input v-model="form.location" type="text" class="w-full rounded-xl sm:rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-base border transition-all duration-300 outline-none" placeholder="Google Maps link" />
                </div>

                <div class="pt-4 sm:pt-6">
                  <h3 class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 sm:mb-4 flex items-center gap-2">
                    <Truck class="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Delivery Method
                  </h3>

                  <!-- Loading skeleton -->
                  <div v-if="shippingLoading" class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div v-for="i in 2" :key="i" class="h-20 rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse"></div>
                  </div>

                  <!-- No methods configured -->
                  <div v-else-if="shippingStore.methods.length === 0" class="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-xs sm:text-sm font-medium">
                    ⚠️ No delivery methods configured. Please contact the store.
                  </div>

                  <!-- Dynamic method cards -->
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <label
                      v-for="method in shippingStore.methods"
                      :key="method._id"
                      @click="selectShipping(method)"
                      :class="[
                        'relative flex flex-col p-4 sm:p-5 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 transform',
                        selectedMethod?._id === method._id
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.01]'
                      ]"
                    >
                      <input type="radio" :value="method._id" class="sr-only" />
                      <span class="flex items-center justify-between">
                        <span class="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                          <span class="text-lg sm:text-xl">{{ method.icon || '🚚' }}</span>
                          {{ method.name }}
                        </span>
                        <div :class="['w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors', selectedMethod?._id === method._id ? 'bg-indigo-600' : 'bg-slate-200']">
                          <Check v-if="selectedMethod?._id === method._id" class="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      </span>
                      <span class="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 font-medium">
                        {{ method.description || 'Standard delivery' }} ·
                        <span class="text-indigo-600 font-bold">+${{ Number(method.price).toFixed(2) }}</span>
                        <span v-if="method.estimatedDays" class="text-slate-400 ml-1">({{ method.estimatedDays }})</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div class="pt-6 sm:pt-8">
                  <button type="submit" :disabled="placingOrder" class="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-sm sm:text-lg py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:from-indigo-700 hover:to-indigo-800 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2">
                    <svg v-if="placingOrder" class="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ placingOrder ? 'Generating Payment...' : 'Proceed to Payment' }}
                  </button>
                  <p v-if="orderError" class="mt-3 sm:mt-4 text-xs sm:text-sm font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg">{{ orderError }}</p>
                </div>
              </form>
            </div>

            <!-- Step 2: Bakong KHQR Payment -->
            <div v-else class="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-6 sm:p-8 md:p-12 text-center">
              <div class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-sm">
                <ShieldCheck class="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 sm:mb-3 tracking-tight">Secure Payment</h2>
              <p class="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-10 max-w-sm mx-auto leading-relaxed">Scan the KHQR code below using your Bakong app or any supported mobile banking app.</p>
              
              <div class="inline-block p-4 sm:p-5 border border-slate-100 rounded-2xl sm:rounded-3xl bg-white relative shadow-2xl shadow-indigo-600/10 mb-8 sm:mb-10 animate-fade-in-up">
                <div class="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-2xl sm:rounded-3xl animate-pulse pointer-events-none"></div>
                <img :src="bakongQrImageUrl" alt="Bakong KHQR" class="w-48 h-48 sm:w-72 sm:h-72 rounded-xl sm:rounded-2xl relative z-10 shadow-sm" />
                <!-- Mock Bakong Logo Badge -->
                <div class="absolute -top-4 sm:-top-5 -right-4 sm:-right-5 bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xl z-20 transform rotate-12 hover:rotate-0 transition-transform duration-300">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 bg-[#E12A27] rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-tighter">B</div>
                </div>
              </div>

              <div class="max-w-xs mx-auto animate-fade-in-up" style="animation-delay: 100ms;">
                <div class="flex items-center justify-between bg-slate-900 p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-md shadow-slate-900/20">
                  <span class="text-xs sm:text-sm text-slate-400 font-medium">Total Amount:</span>
                  <span class="font-black text-white text-lg sm:text-xl">${{ orderTotal.toFixed(2) }}</span>
                </div>
                
                <div class="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-50 rounded-full border border-rose-100">
                  <div class="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-rose-500"></span>
                  </div>
                  <p class="text-[10px] sm:text-xs font-bold text-rose-600">
                    Awaiting payment • <span class="font-mono ml-1" :class="countdown < 60 ? 'animate-pulse text-red-600' : ''">{{ countdownFormatted }}</span>
                  </p>
                </div>
              </div>
              
              <button @click="cancelPayment" class="mt-8 sm:mt-12 text-[11px] sm:text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors border-b border-transparent hover:border-slate-800 pb-0.5">Cancel & Edit Details</button>
            </div>
          </transition>

        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:col-span-5 xl:col-span-4 mt-6 sm:mt-10 lg:mt-0">
          <div class="bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/40 p-5 md:p-8 sticky top-24 text-white overflow-hidden relative">
            
            <!-- Sidebar decorations -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 transform translate-x-10 -translate-y-10"></div>
            
            <h2 class="text-lg sm:text-xl font-black mb-5 sm:mb-8 flex items-center gap-2 relative z-10">
              Order Summary
              <span class="px-2 py-0.5 bg-white/10 rounded-md text-[10px] sm:text-xs font-bold">{{ cartStore.items.length }}</span>
            </h2>
            
            <div class="space-y-3 sm:space-y-4 mb-6 sm:mb-8 relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              <transition-group name="list" appear>
                <div v-for="(item, index) in cartStore.items" :key="item.product" class="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl hover:bg-white/5 transition-colors" :style="`transition-delay: ${index * 50}ms`">
                  <div class="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                    <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-grow flex flex-col justify-center">
                    <h4 class="text-xs sm:text-sm font-bold text-white line-clamp-1 mb-0.5 sm:mb-1">{{ item.name }}</h4>
                    <div class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400 font-medium">
                      <span>Qty: {{ item.qty }}</span>
                      <span v-if="item.size || item.color">•</span>
                      <span v-if="item.size || item.color" class="uppercase">{{ item.color }} {{ item.size }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end justify-center">
                    <p class="text-xs sm:text-sm font-bold">${{ (item.price * item.qty).toFixed(2) }}</p>
                    <p v-if="item.qty > 1" class="text-[9px] sm:text-[10px] text-slate-400 font-medium">${{ item.price.toFixed(2) }} each</p>
                  </div>
                </div>
              </transition-group>
            </div>

            <!-- Receipt cut line -->
            <div class="relative flex items-center justify-center my-4 sm:my-6 z-10">
              <div class="absolute left-0 w-3 h-3 sm:w-4 sm:h-4 bg-slate-50 rounded-full -translate-x-10"></div>
              <div class="w-full border-t-2 border-dashed border-white/20"></div>
              <div class="absolute right-0 w-3 h-3 sm:w-4 sm:h-4 bg-slate-50 rounded-full translate-x-10"></div>
            </div>

            <div class="space-y-3 sm:space-y-4 relative z-10">
              <div class="flex justify-between text-xs sm:text-sm text-slate-300 font-medium">
                <span>Subtotal</span>
                <span class="text-white">${{ cartStore.totalPrice.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs sm:text-sm text-slate-300 font-medium">
                <span>Shipping <span class="text-[9px] sm:text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-1">{{ form.deliveryCompany.split(' ')[0] }}</span></span>
                <span class="text-white">${{ shippingCost.toFixed(2) }}</span>
              </div>
              
              <div class="flex justify-between items-end pt-4 sm:pt-6 border-t border-white/10">
                <span class="text-sm sm:text-base font-medium text-slate-300">Total Due</span>
                <span class="text-2xl sm:text-3xl font-black text-white">${{ orderTotal.toFixed(2) }}</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animations & Transitions */
.slide-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}

@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

/* ── Success celebration ─────────────────────────────────────────── */
@keyframes pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
  80%  { transform: scale(0.95) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.animate-pop { animation: pop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

@keyframes rise {
  0%   { opacity: 0; transform: translateY(22px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-rise { animation: rise 0.55s ease forwards; opacity: 0; }

@keyframes ping-slow {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50%       { transform: scale(1.15); opacity: 0; }
}
.animate-ping-slow { animation: ping-slow 2s ease-in-out infinite; }

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.animate-spin-slow { animation: spin-slow 8s linear infinite; }

/* ── Confetti ─────────────────────────────────────────────────────── */
.confetti-container {
  position: absolute; inset: 0;
  overflow: hidden; z-index: 20;
}
.confetti-dot {
  position: absolute;
  top: -10px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background-color: var(--color);
  animation: confetti-fall var(--dur) var(--delay) ease-out forwards;
  opacity: 0;
}
@keyframes confetti-fall {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: translateY(420px) rotate(var(--rot)) scale(0.5); }
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
