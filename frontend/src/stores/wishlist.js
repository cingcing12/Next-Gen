import { defineStore } from 'pinia';
import api from '../api/axios';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchWishlist() {
      this.loading = true;
      try {
        const { data } = await api.get('/users/wishlist');
        this.items = data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch wishlist';
      } finally {
        this.loading = false;
      }
    },
    async addToWishlist(productId) {
      try {
        const { data } = await api.post('/users/wishlist', { productId });
        this.items = data; // backend returns populated wishlist array
      } catch (error) {
        console.error(error);
      }
    },
    async removeFromWishlist(productId) {
      try {
        const { data } = await api.delete(`/users/wishlist/${productId}`);
        this.items = data; // backend returns populated wishlist array
      } catch (error) {
        console.error(error);
      }
    }
  }
});
