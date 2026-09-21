import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import Home from '../pages/Home.vue'
import Shop from '../pages/Shop.vue'
import ProductDetail from '../pages/ProductDetail.vue'
import Checkout from '../pages/Checkout.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'

import About from '../pages/About.vue'
import Contact from '../pages/Contact.vue'
import Profile from '../pages/Profile.vue'
import Wishlist from '../pages/Wishlist.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../pages/admin/AdminLogin.vue')
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../pages/admin/Dashboard.vue')
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../pages/admin/ProductManager.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../pages/admin/CategoryManager.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../pages/admin/UserManager.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../pages/admin/OrderManager.vue')
      },
      {
        path: 'shipping',
        name: 'AdminShipping',
        component: () => import('../pages/admin/ShippingManager.vue')
      },
      {
        path: 'content',
        name: 'AdminContent',
        component: () => import('../pages/admin/ContentManager.vue')
      }
    ]
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: 'shop',
        name: 'Shop',
        component: Shop
      },
      {
        path: 'shop/:category',
        name: 'ShopCategory',
        component: Shop
      },
      {
        path: 'shop/:category/:subCategory',
        name: 'ShopSubCategory',
        component: Shop
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: ProductDetail
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: Checkout,
        meta: { requiresAuth: true }
      },
      {
        path: 'wishlist',
        name: 'Wishlist',
        component: Wishlist,
        meta: { requiresAuth: true }
      },
      {
        path: 'about',
        name: 'About',
        component: About
      },
      {
        path: 'contact',
        name: 'Contact',
        component: Contact
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Redirect if already logged in and trying to access login pages
  if (to.path === '/login' && authStore.isAuthenticated) {
    return next(authStore.isAdmin ? '/admin' : '/')
  }
  if (to.path === '/admin/login' && authStore.isAuthenticated && authStore.isAdmin) {
    return next('/admin')
  }

  // Handle protected routes
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    if (to.path.startsWith('/admin')) {
      next('/admin/login')
    } else {
      next('/login')
    }
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
