<script setup>
import { ref } from 'vue'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Truck
} from 'lucide-vue-next'
import { useUIStore } from '../stores/ui'

const ui = useUIStore()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const subject = ref('Order Status')
const message = ref('')
const isSubmitting = ref(false)

const subjects = [
  'Order Status',
  'Bakong KHQR Payment',
  'Size & Fitting',
  'Returns & Exchange',
  'General Inquiry'
]

// FAQ Items state
const faqs = ref([
  {
    q: 'How fast is delivery across Cambodia?',
    a: 'Phnom Penh orders are delivered within 2-4 hours or same-day. Orders to all 25 provinces via Vireak Buntham Express or J&T typically arrive within 24-48 hours with real-time tracking.',
    open: true
  },
  {
    q: 'How does Bakong KHQR payment work?',
    a: 'During checkout, a dynamic Bakong KHQR code is generated with your exact order total. Open any Cambodian mobile banking app (ABA, ACLEDA, Wing, Canadia, Sathapana, etc.) and scan to pay. Verification is 100% automated and instant!',
    open: false
  },
  {
    q: 'What is your size exchange and return policy?',
    a: 'We offer a 30-day hassle-free exchange policy. If an item doesn’t fit properly, keep the original tags attached and contact our support team. We will arrange a courier exchange right to your doorstep.',
    open: false
  },
  {
    q: 'Can I inspect the clothes before accepting cash on delivery?',
    a: 'Yes! For Cash on Delivery (COD) orders within Phnom Penh, our riders allow you to check the package before completing payment.',
    open: false
  }
])

const toggleFaq = (idx) => {
  faqs.value[idx].open = !faqs.value[idx].open
}

const handleSubmit = async () => {
  if (!fullName.value.trim() || !email.value.trim() || !message.value.trim()) {
    ui.toast('Please fill out your name, email, and message.', 'error')
    return
  }

  isSubmitting.value = true
  // Simulate network request
  setTimeout(() => {
    isSubmitting.value = false
    ui.toast('Message sent successfully! Our team will respond within 1 hour.', 'success')
    fullName.value = ''
    email.value = ''
    phone.value = ''
    message.value = ''
    subject.value = 'Order Status'
  }, 700)
}
</script>

<template>
  <div class="bg-slate-50/60 min-h-screen pb-20">
    
    <!-- Hero Header Banner -->
    <div class="bg-white border-b border-slate-200/80 pt-8 sm:pt-12 pb-10 sm:pb-14 relative overflow-hidden">
      <!-- Ambient Lighting Orbs -->
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2 sm:mb-3 shadow-2xs">
          <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
          <span>24/7 Customer Care & Assistance</span>
        </div>

        <h1 class="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          We’re Here to Help You Style Better
        </h1>
        <p class="text-slate-500 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          Have questions about sizing, delivery times, or Bakong KHQR checkout? Our team in Phnom Penh is ready to support you.
        </p>
      </div>
    </div>

    <!-- Quick Channel Cards Strip -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        <!-- Telegram Support Card -->
        <a
          href="https://t.me"
          target="_blank"
          class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-300 transition-all group flex items-start justify-between"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare class="w-6 h-6" />
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 class="text-sm font-bold text-slate-900">Telegram Live Chat</h3>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p class="text-xs text-sky-600 font-semibold mt-0.5">@nextgen_support</p>
              <p class="text-[11px] text-slate-400 mt-1">Typical reply time: Under 5 mins</p>
            </div>
          </div>
          <ExternalLink class="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition" />
        </a>

        <!-- Phone Hotline Card -->
        <a
          href="tel:+85512345678"
          class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex items-start justify-between"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
              <Phone class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Phone Hotline</h3>
              <p class="text-xs text-indigo-600 font-semibold mt-0.5">+855 12 345 678</p>
              <p class="text-[11px] text-slate-400 mt-1">Mon - Sun: 8:00 AM - 9:00 PM</p>
            </div>
          </div>
          <ExternalLink class="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />
        </a>

        <!-- Email Inquiries Card -->
        <a
          href="mailto:support@nextgen.com"
          class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group flex items-start justify-between"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
              <Mail class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Email Inquiries</h3>
              <p class="text-xs text-purple-600 font-semibold mt-0.5">support@nextgen.com</p>
              <p class="text-[11px] text-slate-400 mt-1">For wholesale & customer orders</p>
            </div>
          </div>
          <ExternalLink class="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition" />
        </a>

      </div>
    </div>

    <!-- Main Content Section: Left Info/FAQ + Right Interactive Form -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        <!-- Left Side (5 cols): Store Hub Details & FAQs -->
        <div class="lg:col-span-5 space-y-4 sm:space-y-6">
          
          <!-- Physical Location & Pickup Hub Card -->
          <div class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center gap-3 mb-3 sm:mb-4">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <MapPin class="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900">Boutique & Pickup Hub</h3>
                <p class="text-[10px] sm:text-xs text-slate-400">Flagship showroom in Phnom Penh</p>
              </div>
            </div>

            <p class="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              Street 302, Boeung Keng Kang 1 (BKK1), Khan Chamkarmon, Phnom Penh, Cambodia 120102.
            </p>

            <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs">
              <div class="flex items-center gap-1.5 text-slate-600 font-medium">
                <Clock class="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                <span>Open Daily: 8:00 AM - 9:00 PM</span>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Open Now
              </span>
            </div>
          </div>

          <!-- Courier & Payment Badges -->
          <div class="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-3 sm:space-y-4">
            <div class="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Truck class="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Official Delivery Network</span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              We partner with Vireak Buntham Express and J&T Express for door-to-door delivery across all provinces with live SMS updates.
            </p>
            <div class="pt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span class="px-2 sm:px-3 py-1 bg-white/10 rounded-lg text-[10px] sm:text-xs font-bold backdrop-blur-md">
                Vireak Buntham
              </span>
              <span class="px-2 sm:px-3 py-1 bg-white/10 rounded-lg text-[10px] sm:text-xs font-bold backdrop-blur-md">
                J&T Express
              </span>
              <span class="px-2 sm:px-3 py-1 bg-white/10 rounded-lg text-[10px] sm:text-xs font-bold backdrop-blur-md">
                GrabExpress
              </span>
            </div>
          </div>

          <!-- Frequently Asked Questions Accordion -->
          <div class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center gap-2 mb-4">
              <HelpCircle class="w-4 h-4 text-indigo-600" />
              <h3 class="text-sm font-black uppercase tracking-wider text-slate-900">
                Quick Answers (FAQ)
              </h3>
            </div>

            <div class="space-y-3">
              <div
                v-for="(faq, idx) in faqs"
                :key="idx"
                class="border border-slate-100 rounded-2xl overflow-hidden transition-all"
                :class="faq.open ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50'"
              >
                <button
                  type="button"
                  @click="toggleFaq(idx)"
                  class="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                >
                  <span>{{ faq.q }}</span>
                  <ChevronUp v-if="faq.open" class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <ChevronDown v-else class="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
                <div v-if="faq.open" class="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed pt-1">
                  {{ faq.a }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Side (7 cols): Modern Contact Message Form -->
        <div class="lg:col-span-7 bg-white p-5 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          
          <div class="mb-5 sm:mb-6">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
              <Mail class="w-3.5 h-3.5 text-indigo-600" />
              <span>Direct Support Message</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Send us a Message
            </h2>
            <p class="text-[11px] sm:text-xs text-slate-500 mt-1">
              Fill in your inquiry below and our support staff will respond promptly.
            </p>
          </div>

          <!-- Subject Pill Selector -->
          <div class="mb-6">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Select Inquiry Topic
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sub in subjects"
                :key="sub"
                type="button"
                @click="subject = sub"
                :class="subject === sub ? 'bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                class="px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                {{ sub }}
              </button>
            </div>
          </div>

          <!-- Form Fields -->
          <form class="space-y-4" @submit.prevent="handleSubmit">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div>
                <label for="name" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  v-model="fullName"
                  type="text"
                  required
                  placeholder="e.g. Sophea Chem"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
                />
              </div>

              <!-- Phone / Telegram -->
              <div>
                <label for="phone" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone or Telegram
                </label>
                <input
                  id="phone"
                  v-model="phone"
                  type="text"
                  placeholder="e.g. +855 12 345 678"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
                />
              </div>
            </div>

            <!-- Email Address -->
            <div>
              <label for="email" class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address <span class="text-red-500">*</span>
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="name@example.com"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition"
              />
            </div>

            <!-- Message Area -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="message" class="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Message <span class="text-red-500">*</span>
                </label>
                <span class="text-[11px] text-slate-400 font-mono">{{ message.length }} chars</span>
              </div>
              <textarea
                id="message"
                v-model="message"
                rows="4"
                required
                placeholder="How can our customer service team help you today? Please mention your Order ID if applicable."
                class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition resize-none"
              ></textarea>
            </div>

            <!-- Submit Action -->
            <div class="pt-2 sm:pt-3">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <template v-if="isSubmitting">
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending Message...</span>
                </template>
                <template v-else>
                  <Send class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Submit Inquiry</span>
                </template>
              </button>
            </div>

            <div class="pt-3 flex items-center justify-center gap-2 text-slate-400 text-xs text-center">
              <ShieldCheck class="w-4 h-4 text-emerald-500" />
              <span>Your privacy is protected. We will never share your personal information.</span>
            </div>

          </form>

        </div>

      </div>
    </div>

  </div>
</template>
