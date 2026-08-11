import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  playgroundOptimizeExclude,
  playgroundResolveDedupe,
  playgroundUiPlugins,
} from './vite.shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Standalone playground (`yarn start:dev`).
 *
 * The docs site embeds the same app via VitePress (`yarn docs:dev`) — no second
 * static copy under `docs/public/play` is required for GitHub Pages.
 *
 * Optional `PLAYGROUND_BASE` remains for a standalone static export if needed.
 */
const playgroundBase = process.env.PLAYGROUND_BASE ?? '/'

export default defineConfig({
  base: playgroundBase,
  plugins: [...playgroundUiPlugins(), vue()],

  build: {
    outDir: path.resolve(__dirname, '../docs/public/play'),
    emptyOutDir: true,
  },

  optimizeDeps: {
    /*
     * Nuxt UI excludes itself from pre-bundling, but not `@nuxt/icon`: its runtime
     * files import the `#imports` alias, which only Nuxt UI's Vite plugin can
     * resolve — and the esbuild pre-bundler runs outside that pipeline.
     *
     * `playgroundOptimizeExclude()` keeps every tiptap / ProseMirror package on
     * that same unbundled side — see its definition for why `dedupe` below is not
     * enough on its own.
     */
    exclude: ['@nuxt/ui', '@nuxt/icon', ...playgroundOptimizeExclude()],
  },

  resolve: {
    /*
     * ProseMirror identifies its plugins by object identity: two copies of
     * `prosemirror-state` in the dependency tree and `UEditor` throws
     * « Adding different instances of a keyed plugin (plugin$) ».
     */
    dedupe: [...playgroundResolveDedupe],
  },
})
