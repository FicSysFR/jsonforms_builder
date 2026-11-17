import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { getIconData } from '@iconify/utils'
import type { IconifyJSON } from '@iconify/types'
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { CONTROL_ICONS } from '../../src/icons'

const root = resolve(__dirname, '../..')
const require = createRequire(import.meta.url)

/**
 * The library imports Nuxt UI's Nuxt-flavoured `Icon.vue`, which renders through `@nuxt/icon`.
 * Outside Nuxt, a Vite host stubs the two Nuxt virtual modules it needs. Here the client
 * bundle stub registers the published `CONTROL_ICONS` from `@iconify-json/lucide` at build
 * time, so the page never asks the Iconify API for an icon: any missing icon becomes a
 * `connect-src` violation that the recipe reports.
 */
function nuxtIconOfflineBundle(names: readonly string[]): Plugin {
  const BUNDLE = '\0recipe:nuxt-icon-client-bundle'
  const IMPORTS = '\0recipe:imports'
  const lucide = JSON.parse(
    readFileSync(require.resolve('@iconify-json/lucide/icons.json'), 'utf8'),
  ) as IconifyJSON
  const icons = Object.fromEntries(
    names.map((name) => {
      const bare = name.replace(/^i-lucide-/, '')
      const data = getIconData(lucide, bare)
      if (!data) throw new Error(`Unknown Lucide icon ${name}`)
      return [`lucide:${bare}`, data]
    }),
  )

  return {
    name: 'recipe:nuxt-icon-offline-bundle',
    enforce: 'pre',
    resolveId(id) {
      if (id === '#build/nuxt-icon-client-bundle') return BUNDLE
      if (id === '#imports') return IMPORTS
    },
    load(id) {
      if (id === BUNDLE) {
        return `const icons = ${JSON.stringify(icons)}
let registered = false
export function init(addIcon) {
  if (registered) return
  registered = true
  for (const [name, data] of Object.entries(icons)) addIcon(name, data)
}`
      }
      if (id === IMPORTS) {
        return `export * from '@nuxt/ui/runtime/vue/stubs/base.js'
export { defineComponent, onServerPrefetch } from 'vue'
export const useRequestFetch = () => fetch
export const useAsyncData = async (_key, handler) => ({
  data: { value: await handler() }, error: { value: null }, pending: { value: false },
})`
      }
    },
  }
}

/**
 * Builds the CSP recipe page against the published `dist`, the way a Vue + Vite host consumes
 * the library: Nuxt UI's Vite plugin without color mode (its anti-flash script is inline), icons
 * rendered as inline SVG (`@nuxt/icon`'s CSS mode injects a `<style>` element) and bundled
 * offline from the library's published list.
 */
export default defineConfig({
  root: resolve(__dirname, 'fixture'),
  plugins: [
    nuxtIconOfflineBundle(CONTROL_ICONS),
    ui({
      colorMode: false,
      icon: {
        mode: 'svg',
        cssSelectorPrefix: 'i-',
        collections: ['lucide'],
        // Nuxt UI's Vue `Icon` bundles its own default icons only: add the library's.
        clientBundle: { icons: [...CONTROL_ICONS] },
      },
    }),
    vue(),
  ],
  resolve: {
    // The published `./core` entry: the page must load without any Tiptap code.
    alias: [
      {
        find: /^@ficsysfr\/jsonforms_builder\/core$/,
        replacement: resolve(root, 'dist/core.es.js'),
      },
    ],
    dedupe: ['vue', '@tiptap/core', '@tiptap/pm', '@tiptap/vue-3'],
  },
  optimizeDeps: { exclude: ['@nuxt/ui', '@nuxt/icon'] },
  build: {
    outDir: resolve(__dirname, '.dist'),
    emptyOutDir: true,
    // No inline module-preload polyfill under `script-src 'self'`.
    modulePreload: { polyfill: false },
    // Readable stack traces in violation reports (`sourceFile:lineNumber`).
    minify: false,
  },
})
