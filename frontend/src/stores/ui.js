import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    toasts: [],
    confirmDialog: {
      isOpen: false,
      title: '',
      message: '',
      resolve: null,
      reject: null
    }
  }),
  actions: {
    toast(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, message, type })
      
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    },
    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    },
    
    confirm(title, message = '', type = 'info') {
      return new Promise((resolve, reject) => {
        this.confirmDialog = {
          isOpen: true,
          title,
          message,
          type,
          resolve,
          reject
        }
      })
    },
    resolveConfirm(value) {
      if (this.confirmDialog.resolve) {
        this.confirmDialog.resolve(value)
      }
      this.confirmDialog.isOpen = false
    }
  }
})
