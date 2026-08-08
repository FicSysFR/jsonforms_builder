import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pugPlugin from 'vite-plugin-pug'
import ui from '@nuxt/ui/vite'
import type { Plugin } from 'vite'
import { expressDevPlugin } from './express-server'

/**
 * Stub de `#build/nuxt-icon-client-bundle`.
 *
 * `UIcon` s'appuie sur `@nuxt/icon`, dont le runtime importe un module généré par le
 * *module Nuxt* — inexistant en mode Vue pur. Sans ce stub, toute page utilisant une
 * icône (donc le moindre `UButton`) échoue à la résolution.
 *
 * Le bundle client sert à embarquer des icônes hors ligne ; ici elles sont chargées à la
 * demande par `@iconify/vue`, un `init` vide suffit donc.
 */
function nuxtIconVueShims(): Plugin {
  const BUNDLE = '\0virtual:nuxt-icon-client-bundle'
  const IMPORTS = '\0virtual:playground-imports'

  return {
    name: 'playground:nuxt-icon-vue-shims',
    enforce: 'pre',
    resolveId(id) {
      if (id === '#build/nuxt-icon-client-bundle') return BUNDLE
      if (id === '#imports') return IMPORTS
    },
    load(id) {
      // Le bundle client sert à embarquer des icônes hors ligne ; ici elles sont
      // chargées à la demande par `@iconify/vue`, un `init` vide suffit.
      if (id === BUNDLE) {
        return 'export function init() {}'
      }

      /*
       * `#imports` : on reprend le stub de Nuxt UI et on complète les quatre symboles
       * que `@nuxt/icon` attend en plus (`onServerPrefetch`, `defineComponent`,
       * `useAsyncData`, `useRequestFetch`). Le playground étant une SPA client, les
       * versions dégradées suffisent.
       */
      if (id === IMPORTS) {
        return `
export * from '@nuxt/ui/runtime/vue/stubs/base.js'
export { defineComponent, onServerPrefetch } from 'vue'
export const useRequestFetch = () => globalThis.$fetch ?? fetch
export const useAsyncData = async (_key, handler) => {
  const data = await handler()
  return { data: { value: data }, error: { value: null }, pending: { value: false } }
}
`
      }
    },
  }
}

export default defineConfig({
  plugins: [
    nuxtIconVueShims(),
    // `ui()` en premier : il pose `optimizeDeps.exclude` sur `@nuxt/ui` (indispensable pour
    // que Vite résolve `#build/ui/*` et `#imports`) et installe l'auto-import des `U*`.
    // `colorMode` monte le plugin de thème clair/sombre hors Nuxt.
    ui({
      colorMode: true,
      ui: {
        colors: {
          primary: 'brand',
          neutral: 'slate',
        },
      },
    }),
    vue(),
    pugPlugin({
      pretty: true,
    }),
    expressDevPlugin(),
  ],

  optimizeDeps: {
    /*
     * Nuxt UI s'exclut lui-même du pré-bundling, mais pas `@nuxt/icon` : ses fichiers
     * runtime importent l'alias `#imports`, que seul le plugin Vite de Nuxt UI sait
     * résoudre — et le pré-bundleur esbuild tourne en dehors de ce pipeline.
     */
    exclude: ['@nuxt/ui', '@nuxt/icon'],
  },

  resolve: {
    /*
     * ProseMirror identifie ses plugins par identité d'objet : deux copies de
     * `prosemirror-state` dans l'arbre de dépendances et `UEditor` lève
     * « Adding different instances of a keyed plugin (plugin$) ».
     *
     * Les gestionnaires de paquets en installent facilement plusieurs versions
     * (ici 1.4.3 sous `prosemirror-keymap` et 1.4.4 à la racine), d'où cette
     * déduplication explicite. À reproduire côté application hôte si elle utilise
     * le renderer WYSIWYG.
     */
    dedupe: [
      'vue',
      '@tiptap/core',
      '@tiptap/pm',
      '@tiptap/vue-3',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-transform',
      'prosemirror-keymap',
      'prosemirror-commands',
    ],
  },
})
