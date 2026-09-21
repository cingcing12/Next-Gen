import { defineStore } from 'pinia'
import api from '../api/axios'

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    loading: false,
    error: null,
    sseConnection: null,
  }),
  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const response = await api.get('/products')
        this.products = response.data
        this.error = null
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch products'
      } finally {
        this.loading = false
      }
    },
    async createProduct(productData) {
      try {
        const response = await api.post('/products', productData)
        this.products.push(response.data)
        return response.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to create product'
      }
    },
    async updateProduct(id, productData) {
      try {
        const response = await api.put(`/products/${id}`, productData)
        const index = this.products.findIndex(p => p._id === id)
        if (index !== -1) {
          this.products[index] = response.data
        }
        return response.data
      } catch (error) {
        throw error.response?.data?.message || 'Failed to update product'
      }
    },
    async deleteProduct(id) {
      try {
        await api.delete(`/products/${id}`)
        // Note: We don't necessarily need to filter here if SSE handles it,
        // but it's fine to do it optimistically.
        this.products = this.products.filter(p => p._id !== id)
      } catch (error) {
        throw error.response?.data?.message || 'Failed to delete product'
      }
    },
    initSSE() {
      if (this.sseConnection) return; // already connected

      // Use the correct backend URL
      const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
      this.sseConnection = new EventSource(`${baseURL}/products/stream`);

      this.sseConnection.addEventListener('product_created', (event) => {
        try {
          const newProduct = JSON.parse(event.data);
          // Only push if not already in array (in case the request that created it also pushed it)
          if (!this.products.find(p => p._id === newProduct._id)) {
            this.products.push(newProduct);
          }
        } catch (e) {
          console.error('Error parsing product_created event', e);
        }
      });

      this.sseConnection.addEventListener('product_updated', (event) => {
        try {
          const updatedProduct = JSON.parse(event.data);
          const index = this.products.findIndex(p => p._id === updatedProduct._id);
          if (index !== -1) {
            this.products[index] = updatedProduct;
          }
        } catch (e) {
          console.error('Error parsing product_updated event', e);
        }
      });

      this.sseConnection.addEventListener('product_deleted', (event) => {
        try {
          const deletedProduct = JSON.parse(event.data);
          this.products = this.products.filter(p => p._id !== deletedProduct._id);
        } catch (e) {
          console.error('Error parsing product_deleted event', e);
        }
      });

      this.sseConnection.onerror = (error) => {
        console.error('SSE Error:', error);
        this.sseConnection.close();
        this.sseConnection = null;
        // Optionally implement reconnect logic here
        setTimeout(() => {
          this.initSSE();
        }, 5000);
      };
    }
  }
})
