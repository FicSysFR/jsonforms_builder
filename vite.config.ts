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
      // `json-formbuilder` (the root) keeps re-exporting everything. The other entries let a
      // host load only what it uses: `core` never imports Tiptap, `advanced` holds the WYSIWYG
      // renderer, `builder` the visual builder. Shared code goes to hashed chunks (`*.js` for ES,
      // `*.cjs` for CommonJS, as Vite names them in a `"type": "module"` package).
      entry: {
        'json-formbuilder': resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core.ts'),
        advanced: resolve(__dirname, 'src/advanced/index.ts'),
        builder: resolve(__dirname, 'src/builder/index.ts'),
        // Dependency-free data, importable from a build configuration (`nuxt.config`).
        icons: resolve(__dirname, 'src/icons.ts'),
      },
      name: 'JsonFormBuilder',
      // The package is `"type": "module"`, so Node reads `*.js` as ESM: a CommonJS file that
      // Node must load (`icons`) needs the `.cjs` extension. The root CJS build keeps its
      // historical name; it targets bundlers, since it imports Nuxt UI SFCs anyway.
      fileName: (format, entryName) =>
        format === 'cjs' && entryName !== 'json-formbuilder'
          ? `${entryName}.cjs`
          : `${entryName}.${format}.js`,
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
