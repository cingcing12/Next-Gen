import { defineStore } from 'pinia';
import api from '../api/axios';
import { useAuthStore } from './auth';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    loading: false,
    error: null,
  }),
  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.isRead).length,
  },
  actions: {
    async fetchNotifications() {
      const authStore = useAuthStore();
      if (!authStore.token) return;

      this.loading = true;
      try {
        const { data } = await api.get('/notifications');
        this.notifications = Array.isArray(data) ? data : [];
        this.error = null;
      } catch (error) {
        this.error = error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      } finally {
        this.loading = false;
      }
    },
    async markAsRead(id) {
      try {
        await api.put(`/notifications/${id}/read`);
        
        // Update local state
        const notification = this.notifications.find(n => n._id === id);
        if (notification) {
          notification.isRead = true;
        }
      } catch (error) {
        console.error('Error marking notification as read', error);
      }
    },
    async markAllAsRead() {
      try {
        await api.put('/notifications/read-all');
        
        // Update local state
        this.notifications.forEach(n => n.isRead = true);
      } catch (error) {
        console.error('Error marking all notifications as read', error);
      }
    }
  },
});
