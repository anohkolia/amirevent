import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventDetails from '../views/EventDetails.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import ConfirmationView from '../views/ConfirmationView.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminRegister from '../views/admin/AdminRegister.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminEvents from '../views/admin/AdminEvents.vue'
import EventEditor from '../views/admin/EventEditor.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import NotFound from '../views/NotFound.vue'
import { supabase } from '@/integrations/supabase/client'

// Auth guard for admin routes
const checkAdminAuth = async (to: string) => {
  console.log(`[Router] Checking admin auth for route: ${to}`)

  const { data: { session } } = await supabase.auth.getSession()
  console.log(`[Router] Session:`, session ? session.user.email : 'No session')

  if (!session) {
    console.log(`[Router] No session, redirecting to login`)
    return '/admin/login'
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log(`[Router] No user, redirecting to login`)
    return '/admin/login'
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  console.log(`[Router] Role data:`, roleData)

  if (!roleData) {
    console.log(`[Router] No admin role, redirecting to login`)
    return '/admin/login'
  }

  console.log(`[Router] Admin auth passed for ${to}`)
  return true
}

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
      path: '/admin/register',
      name: 'admin-register',
      component: AdminRegister,
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboard,
      beforeEnter: async () => checkAdminAuth('/admin'),
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: AdminEvents,
      beforeEnter: async () => checkAdminAuth('/admin/events'),
    },
    {
      path: '/admin/events/new',
      name: 'admin-events-new',
      component: EventEditor,
      beforeEnter: async () => checkAdminAuth('/admin/events/new'),
    },
    {
      path: '/admin/events/:id',
      name: 'admin-events-edit',
      component: EventEditor,
      beforeEnter: async () => checkAdminAuth('/admin/events/:id'),
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrders,
      beforeEnter: async () => checkAdminAuth('/admin/orders'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    },
  ],
})

export default router
