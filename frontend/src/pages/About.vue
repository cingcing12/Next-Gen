<script setup>
import { ShieldCheck, Truck, RotateCcw, HeartHandshake } from 'lucide-vue-next'
</script>

<template>
  <div class="bg-white">
    <!-- Hero Section -->
    <div class="relative bg-slate-900 py-24 sm:py-32 overflow-hidden">
      <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" alt="About Shop" class="w-full h-full object-cover opacity-30" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">About Next-Gen</h1>
        <p class="mt-6 text-xl text-slate-300 max-w-3xl mx-auto">
          We believe that style is a way to say who you are without having to speak. Our mission is to provide premium, accessible fashion for both men and women, tailored for perfection.
        </p>
      </div>
    </div>

    <!-- Our Values -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-slate-900">Why Shop With Us?</h2>
        <p class="mt-4 text-slate-500 max-w-2xl mx-auto">We are dedicated to providing the best shopping experience possible, focusing on quality, sustainability, and outstanding customer service.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div class="text-center p-6 bg-slate-50 rounded-2xl">
          <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Fast Delivery</h3>
          <p class="text-slate-500 text-sm">Partnered with Vireak Buntham and J&T Express for rapid nationwide delivery.</p>
        </div>

        <div class="text-center p-6 bg-slate-50 rounded-2xl">
          <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Secure Payments</h3>
          <p class="text-slate-500 text-sm">100% secure payments using Bakong KHQR, the national standard.</p>
        </div>

        <div class="text-center p-6 bg-slate-50 rounded-2xl">
          <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Easy Returns</h3>
          <p class="text-slate-500 text-sm">Not happy? Return your items within 30 days for a full refund.</p>
        </div>

        <div class="text-center p-6 bg-slate-50 rounded-2xl">
          <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartHandshake class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Quality Support</h3>
          <p class="text-slate-500 text-sm">Our team is available 24/7 to help you with any questions or issues.</p>
        </div>
      </div>
    </div>
  </div>
</template>
