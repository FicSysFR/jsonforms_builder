import './examples'
import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'

/**
 * Le playground n'a pas de routes, mais `ULink` — utilisé en interne par `UButton` —
 * injecte la position de route. Sans routeur, chaque bouton émet un avertissement Vue.
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:catchAll(.*)', component: { render: () => null } }],
})

createApp(App).use(router).use(ui).mount('#app')
