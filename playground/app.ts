import './examples'
import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import GalleryView from './views/GalleryView.vue'
import BuilderView from './views/BuilderView.vue'

/**
 * Hash history keeps deep links (`#/builder`) working on GitHub Pages under
 * `/jsonforms_builder/play/` without a server-side SPA fallback.
 *
 * `import.meta.env.BASE_URL` mirrors Vite's `base` so that base resolves correctly.
 */
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'gallery', component: GalleryView },
    { path: '/builder', name: 'builder', component: BuilderView },
    { path: '/:catchAll(.*)', redirect: '/' },
  ],
})

createApp(App).use(router).use(ui).mount('#app')
