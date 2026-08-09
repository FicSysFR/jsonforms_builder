import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import pugPlugin from 'vite-plugin-pug'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src'],
      insertTypesEntry: true,
    }),
    // vite-plugin-pug options typing is incomplete for Vue SFC usage.
    // biome-ignore lint/suspicious/noExplicitAny: plugin options not fully typed
    pugPlugin(<any>{
      pretty: true,
      compilerOptions: {},
    }),
  ],

  build: {
    outDir: './dist',

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JsonFormBuilder',
      fileName: (format) => `json-formbuilder.${format}.js`,
      // No UMD in v2: renderers import `@nuxt/ui` SFCs that do not exist as browser
      // globals. The library now requires a bundler.
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      // Keep `@nuxt/ui` external *including* deep SFC imports
      // (`@nuxt/ui/components/Input.vue`): those files reference Nuxt aliases
      // `#build/ui/*` and `#imports`, which only the consumer's Vite plugin can resolve.
      external: [
        'vue',
        /^@nuxt\/ui(\/.*)?$/,
        '@jsonforms/core',
        '@jsonforms/vue',
        // TipTap is provided by the host via `@nuxt/ui` — keep a single copy so
        // ProseMirror plugins stay identity-stable (and WYSIWYG image extensions resolve).
        /^@tiptap\//,
        // Externalized to avoid shipping a duplicate: Nuxt UI already provides
        // `@internationalized/date`, and `defu`/`radash` are plain ESM with no interop trap.
        '@internationalized/date',
        'defu',
        'radash',
        // `dayjs` is deliberately *included* in the bundle: it is CommonJS, and leaving
        // it external would force every host app to list it in `optimizeDeps.include`
        // so its default export is exposed. ~7 KB.
      ],
    },

    sourcemap: true,
    cssCodeSplit: false,
  },

  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
  },
})
