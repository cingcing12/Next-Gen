import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('userInfo')) || null,
    token: localStorage.getItem('userToken') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user && state.user.role === 'admin',
  },
  actions: {
    setCredentials(userData) {
      this.user = userData;
      this.token = userData.token;
      localStorage.setItem('userInfo', JSON.stringify(userData));
      localStorage.setItem('userToken', userData.token);
    },
    async login(email, password) {
      const response = await api.post('/users/login', { email, password })
      this.setCredentials(response.data)
      return response.data
    },
    async register(name, email, password) {
      const response = await api.post('/users/register', { fullName: name, email, password })
      this.setCredentials(response.data)
      return response.data
    },
    async loginWithGoogle(credential) {
      const response = await api.post('/users/google', { credential })
      this.setCredentials(response.data)
      return response.data
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userToken');
    }
  }
})
