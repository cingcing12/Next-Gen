import { defineStore } from 'pinia'
import api from '../api/axios'
import { useAuthStore } from './auth'
import { useCategoryStore } from './category'
import { useRouter } from 'vue-router'

export const useSystemStore = defineStore('system', {
  state: () => ({
    sseConnection: null,
    config: null,
    configLoading: false,
    configError: null,
  }),
  actions: {
    async fetchConfig() {
      this.configLoading = true;
      this.configError = null;
      try {
        const { data } = await api.get('/system/config');
        this.config = data;
      } catch (error) {
        this.configError = error.response?.data?.message || 'Failed to load system config';
        console.error(this.configError);
      } finally {
        this.configLoading = false;
      }
    },
    async updateConfig(newConfig) {
      this.configLoading = true;
      this.configError = null;
      try {
        const { data } = await api.put('/system/config', newConfig);
        this.config = data;
        return data;
      } catch (error) {
        this.configError = error.response?.data?.message || 'Failed to update system config';
        console.error(this.configError);
        throw error;
      } finally {
        this.configLoading = false;
      }
    },
    initSSE() {
      if (this.sseConnection) return; // already connected

      const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_URL || '/api';
      this.sseConnection = new EventSource(`${baseURL}/system/stream`);

      this.sseConnection.addEventListener('category_updated', () => {
        const categoryStore = useCategoryStore()
        categoryStore.fetchCategories()
      });

      this.sseConnection.addEventListener('product_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('system:product_updated', { detail: data }));
        } catch(e) {}
      });

      this.sseConnection.addEventListener('order_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('system:order_updated', { detail: data }));
        } catch(e) {}
      });

      this.sseConnection.addEventListener('shipping_updated', () => {
        // Example: if we had a shipping store, we would fetch it.
        // If not, we just reload the page if we are on checkout.
      });

      this.sseConnection.addEventListener('user_blocked', (event) => {
        try {
          const data = JSON.parse(event.data);
          const authStore = useAuthStore()
          
          if (authStore.user && authStore.user._id === data._id && data.isBlocked) {
            authStore.logout()
            // Try to use vue-router to redirect if possible, otherwise use window
            window.location.href = '/login?blocked=true'
          }
        } catch (e) {
          console.error('Error parsing user_blocked event', e);
        }
      });

      this.sseConnection.addEventListener('user_deleted', (event) => {
        try {
          const data = JSON.parse(event.data);
          const authStore = useAuthStore();
          if (authStore.user && authStore.user._id === data._id) {
            authStore.logout();
            window.location.href = '/login?deleted=true';
          }
          window.dispatchEvent(new CustomEvent('system:user_deleted', { detail: data }));
        } catch(e) {}
      });

      this.sseConnection.addEventListener('user_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          const authStore = useAuthStore();
          if (authStore.user && authStore.user._id === data._id) {
            authStore.setCredentials({ ...authStore.user, ...data });
          }
          window.dispatchEvent(new CustomEvent('system:user_updated', { detail: data }));
        } catch(e) {}
      });

      this.sseConnection.addEventListener('config_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.config = data;
        } catch(e) {}
      });

      this.sseConnection.onerror = (error) => {
        console.error('System SSE Error:', error);
        this.sseConnection.close();
        this.sseConnection = null;
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.initSSE();
        }, 5000);
      };
    },
    closeSSE() {
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }
    }
  }
})
