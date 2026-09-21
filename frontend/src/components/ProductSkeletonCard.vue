<template>
  <div class="flex flex-col relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
    <!-- Card Media Skeleton -->
    <div class="relative w-full aspect-[4/5] bg-slate-200"></div>

    <!-- Card Body Skeleton -->
    <div class="p-5 flex flex-col flex-grow">
      
      <!-- Rating & Stock Status Skeleton -->
      <div class="flex items-center justify-between mb-3">
        <div class="w-16 h-4 bg-slate-200 rounded"></div>
        <div class="w-12 h-4 bg-slate-200 rounded-full"></div>
      </div>

      <!-- Title Skeleton -->
      <div class="w-3/4 h-5 bg-slate-200 rounded mb-2"></div>
      
      <!-- Short Description Skeleton -->
      <div class="w-full h-3 bg-slate-200 rounded mb-1"></div>
      <div class="w-2/3 h-3 bg-slate-200 rounded mb-4"></div>

      <!-- Colors Swatches Skeleton -->
      <div class="mb-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="w-10 h-3 bg-slate-200 rounded mr-1"></div>
          <div v-for="i in 3" :key="i" class="w-5 h-5 rounded-full bg-slate-200"></div>
        </div>
      </div>

      <!-- Sizes Pills Skeleton -->
      <div class="mb-4">
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="w-10 h-3 bg-slate-200 rounded mr-1"></div>
          <div v-for="i in 3" :key="i" class="w-8 h-6 rounded-md bg-slate-200"></div>
        </div>
      </div>

      <!-- Bottom Row: Price & Button Skeleton -->
      <div class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <div class="w-8 h-3 bg-slate-200 rounded"></div>
          <div class="w-16 h-6 bg-slate-200 rounded"></div>
        </div>
        <div class="flex-1 max-w-[150px] h-10 bg-slate-200 rounded-xl"></div>
      </div>

    </div>
  </div>
</template>
