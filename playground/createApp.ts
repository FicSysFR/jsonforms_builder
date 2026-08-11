import './examples'
import './assets/main.css'

import { createApp, type App } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'

import AppRoot from './App.vue'
import { playgroundEmbedKey } from './embed'
import GalleryView from './views/GalleryView.vue'
import BuilderView from './views/BuilderView.vue'

export type CreatePlaygroundAppOptions = {
  /**
   * Force the compact “embedded” chrome used inside VitePress.
   * Also seeds `?embed=1` so deep links and the builder keep the same layout.
   */
  embed?: boolean
}

/** Apply VitePress appearance to `html.dark` (shared with Nuxt UI tokens). */
const applyVitePressHtmlTheme = () => {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') {
    return
  }

  const appearance = localStorage.getItem('vitepress-theme-appearance')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark =
    appearance === 'dark' ||
    ((appearance === 'auto' || appearance == null || appearance === '') && prefersDark)

  document.documentElement.classList.toggle('dark', dark)
}

/**
 * Shared factory for the standalone Vite SPA (`app.ts`) and the VitePress host
 * (`PlaygroundEmbed`). Hash history keeps gallery / builder deep links working
 * under GitHub Pages without a server-side SPA fallback.
 *
 * Hash base is always `/` so URLs stay `#/?example=…` on `/playground`.
 */
export const createPlaygroundApp = (options: CreatePlaygroundAppOptions = {}): App => {
  const router = createRouter({
    history: createWebHashHistory('/'),
    routes: [
      { path: '/', name: 'gallery', component: GalleryView },
      { path: '/builder', name: 'builder', component: BuilderView },
      { path: '/:catchAll(.*)', redirect: '/' },
    ],
  })

  if (options.embed) {
    void router.isReady().then(() => {
      if (router.currentRoute.value.query.embed) {
        return
      }
      void router.replace({
        query: { ...router.currentRoute.value.query, embed: '1' },
      })
    })
  }

  const app = createApp(AppRoot)
  app.provide(playgroundEmbedKey, !!options.embed)
  app.use(router)

  if (options.embed) {
    // Align before Nuxt UI color-mode init (it also toggles `html.dark`).
    applyVitePressHtmlTheme()
  }

  app.use(ui)

  if (options.embed) {
    // Color-mode plugin may have rewritten the class from its own storage key.
    applyVitePressHtmlTheme()
  }

  return app
}
