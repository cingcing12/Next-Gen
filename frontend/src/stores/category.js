import { defineStore } from 'pinia'
import api from '../api/axios'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchCategories() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/categories')
        this.categories = data
      } catch (err) {
        this.error = err.response?.data?.message || err.message || 'Failed to fetch categories'
        throw err
      } finally {
        this.loading = false
      }
    },
    async createCategory(categoryData) {
      try {
        const { data } = await api.post('/categories', categoryData)
        this.categories.push(data)
        return data
      } catch (err) {
        throw err
      }
    },
    async updateCategory(id, categoryData) {
      try {
        const { data } = await api.put(`/categories/${id}`, categoryData)
        const index = this.categories.findIndex(c => c._id === id)
        if (index !== -1) {
          this.categories[index] = data
        }
        return data
      } catch (err) {
        throw err
      }
    },
    async deleteCategory(id) {
      try {
        await api.delete(`/categories/${id}`)
        this.categories = this.categories.filter(c => c._id !== id)
      } catch (err) {
        throw err
      }
    }
  }
})
