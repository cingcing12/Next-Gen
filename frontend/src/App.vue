<script setup>
import { onMounted } from 'vue'
import CustomToast from './components/CustomToast.vue'
import CustomConfirm from './components/CustomConfirm.vue'
import { useProductStore } from './stores/product'
import { useSystemStore } from './stores/system'

const productStore = useProductStore()
const systemStore = useSystemStore()

onMounted(() => {
  productStore.initSSE()
  systemStore.initSSE()
})
</script>

<template>
  <router-view />
  <CustomToast />
  <CustomConfirm />
</template>

<style>
/* Global styles can be added here if needed, but we use Tailwind in style.css */
</style>
