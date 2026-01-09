import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventDetails from '../views/EventDetails.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import ConfirmationView from '../views/ConfirmationView.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminEvents from '../views/admin/AdminEvents.vue'
import EventEditor from '../views/admin/EventEditor.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import NotFound from '../views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/event/:id',
      name: 'event-details',
      component: EventDetails,
    },
    {
      path: '/cart',
      name: 'cart',
      component: CartView,
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,
    },
    {
      path: '/confirmation',
      name: 'confirmation',
      component: ConfirmationView,
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLogin,
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboard,
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: AdminEvents,
    },
    {
      path: '/admin/events/new',
      name: 'admin-events-new',
      component: EventEditor,
    },
    {
      path: '/admin/events/:id',
      name: 'admin-events-edit',
      component: EventEditor,
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrders,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    },
  ],
})

export default router
