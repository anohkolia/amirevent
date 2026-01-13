import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTicket,
  faCartShopping,
  faUser,
  faCalendar,
  faMagnifyingGlass,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import App from './App.vue'
import router from './router'

// Register Font Awesome icons globally
library.add(faTicket, faCartShopping, faUser, faCalendar, faMagnifyingGlass, faStar)

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Register Font Awesome component globally
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')
