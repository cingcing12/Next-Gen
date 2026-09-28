import { defineStore } from 'pinia'
import api from '../api/axios'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart')) || [],
    isOpen: false,
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.qty, 0),
    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.qty, 0),
  },
  actions: {
    toggleCart() {
      this.isOpen = !this.isOpen;
    },
    addToCart(product, qty = 1, size = null, color = null) {
      let maxStock = product.stock || 0;
      let basePrice = product.price;

      let variantImage = '';
      if (color && product.colorVariants) {
        const variant = product.colorVariants.find(v => v.color.toLowerCase() === color.toLowerCase());
        if (variant) {
          if (variant.sizeVariants && size) {
            // New schema: per-size stock
            const sv = variant.sizeVariants.find(s => s.size === size);
            maxStock = sv ? sv.stock : 0;
            if (sv && sv.price !== undefined && sv.price !== null && sv.price > 0) {
              basePrice = sv.price;
            }
            if (sv && sv.images && sv.images.length > 0) {
              variantImage = sv.images[0];
            } else if (sv && sv.image) {
              variantImage = sv.image;
            }
          } else if (variant.stock !== undefined) {
            // Old schema fallback
            maxStock = variant.stock;
          }
          if (!variantImage) {
            if (variant.images && variant.images.length > 0) variantImage = variant.images[0];
            else if (variant.image) variantImage = variant.image;
          }
        }
      }

      if (maxStock <= 0) {
        throw new Error(`This variant is currently out of stock`);
      }

      let price = product.discount > 0 ? basePrice * (1 - product.discount / 100) : basePrice;
      
      let qtyToTrack = qty;
      const existingItem = this.items.find(
        (item) => item.product === product._id && item.size === size && item.color === color
      );

      if (existingItem) {
        if (existingItem.qty + qty > maxStock) {
           qtyToTrack = maxStock - existingItem.qty;
           existingItem.qty = maxStock;
        } else {
           existingItem.qty += qty;
           qtyToTrack = qty;
        }
        existingItem.maxStock = maxStock;
        // Update price to the latest in case it changed
        existingItem.price = price;
        // Update image just in case
        existingItem.image = variantImage || existingItem.image;
      } else {
        qtyToTrack = qty > maxStock ? maxStock : qty;
        this.items.push({
          product: product._id,
          name: product.name,
          image: variantImage || ((product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://via.placeholder.com/300')),
          price: price,
          qty: qtyToTrack,
          size,
          color,
          maxStock
        });
      }
      this.saveCart();
      
      // Notify backend to track cart count asynchronously
      if (qtyToTrack > 0) {
        try {
          api.post(`/products/${product._id}/track-cart`, { qty: qtyToTrack }).catch(() => {});
        } catch (e) {
          // Ignore errors for analytics tracking
        }
      }
    },
    removeFromCart(index) {
      const item = this.items[index];
      const removedQty = item.qty;
      this.items.splice(index, 1);
      this.saveCart();
      
      // Notify backend to untrack cart count
      if (item && item.product) {
        try {
          api.post(`/products/${item.product}/untrack-cart`, { qty: removedQty }).catch(() => {});
        } catch (e) {}
      }
    },
    updateQuantity(index, qty) {
      if (qty > 0) {
        const item = this.items[index];
        const oldQty = item.qty;
        item.qty = qty;
        this.saveCart();
        
        if (item && item.product) {
          const delta = qty - oldQty;
          try {
            if (delta > 0) {
              api.post(`/products/${item.product}/track-cart`, { qty: delta }).catch(() => {});
            } else if (delta < 0) {
              api.post(`/products/${item.product}/untrack-cart`, { qty: Math.abs(delta) }).catch(() => {});
            }
          } catch (e) {}
        }
      }
    },
    clearCart() {
      // Untrack all items
      this.items.forEach(item => {
        if (item && item.product) {
          try {
            api.post(`/products/${item.product}/untrack-cart`, { qty: item.qty }).catch(() => {});
          } catch (e) {}
        }
      });
      
      this.items = [];
      this.saveCart();
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.items));
      // Here you would also sync to DB if the user is logged in
    }
  }
})
