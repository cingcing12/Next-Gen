import { defineStore } from 'pinia'
import api from '../api/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const response = await api.get('/users')
        this.users = response.data
        this.error = null
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch users'
      } finally {
        this.loading = false
      }
    },
    async toggleBlockUser(id) {
      try {
        const response = await api.put(`/users/${id}/block`)
        const index = this.users.findIndex(u => u._id === id)
        if (index !== -1) {
          this.users[index].isBlocked = response.data.isBlocked
        }
      } catch (error) {
        throw error.response?.data?.message || 'Failed to update user block status'
      }
    },
    // The backend route for creating a user by admin is technically POST /api/users (register)
    // Wait, register is POST /api/users but usually doesn't take role. 
    // If we assume admin can't explicitly create admin via register route, we'll just use register route for now.
    async createUser(userData) {
      try {
        const response = await api.post('/users/register', userData) // fixed route
        this.users.push(response.data)
        return response.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to create user'
      }
    },
    async updateUser(id, userData) {
      try {
        const response = await api.put(`/users/${id}`, userData)
        const index = this.users.findIndex(u => u._id === id)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data }
        }
        return response.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to update user'
      }
    },
    async deleteUser(id) {
      try {
        await api.delete(`/users/${id}`)
        this.users = this.users.filter(u => u._id !== id)
      } catch (error) {
        throw error.response?.data?.message || 'Failed to delete user'
      }
    }
  }
})
