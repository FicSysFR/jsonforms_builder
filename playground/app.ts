import './examples'
import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'

/**
 * The playground has no routes, but `ULink` — used internally by `UButton` —
 * injects the route location. Without a router, every button emits a Vue warning.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:catchAll(.*)', component: { render: () => null } }],
})

createApp(App).use(router).use(ui).mount('#app')
