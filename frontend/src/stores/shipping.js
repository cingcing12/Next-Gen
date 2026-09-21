import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/axios'

export const useShippingStore = defineStore('shipping', () => {
  const methods = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchMethods = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/shipping')
      methods.value = data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch shipping methods'
    } finally {
      loading.value = false
    }
  }

  const fetchActiveMethods = async () => {
    const { data } = await api.get('/shipping/active')
    methods.value = data
    return data
  }

  const createMethod = async (payload) => {
    const { data } = await api.post('/shipping', payload)
    methods.value.push(data)
    return data
  }

  const updateMethod = async (id, payload) => {
    const { data } = await api.put(`/shipping/${id}`, payload)
    const idx = methods.value.findIndex(m => m._id === id)
    if (idx !== -1) methods.value[idx] = data
    return data
  }

  const deleteMethod = async (id) => {
    await api.delete(`/shipping/${id}`)
    methods.value = methods.value.filter(m => m._id !== id)
  }

  const toggleMethod = async (id) => {
    const { data } = await api.patch(`/shipping/${id}/toggle`)
    const idx = methods.value.findIndex(m => m._id === id)
    if (idx !== -1) methods.value[idx] = data
    return data
  }

  return { methods, loading, error, fetchMethods, fetchActiveMethods, createMethod, updateMethod, deleteMethod, toggleMethod }
})
