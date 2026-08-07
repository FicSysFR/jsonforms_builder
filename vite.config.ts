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
      // Pas d'UMD en v2 : les renderers importent des SFC de `@nuxt/ui` qui n'existent
      // pas sous forme de global navigateur. La lib requiert désormais un bundler.
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      // `@nuxt/ui` reste externe *y compris* ses imports profonds de SFC
      // (`@nuxt/ui/components/Input.vue`) : ces fichiers référencent les alias Nuxt
      // `#build/ui/*` et `#imports`, que seul le plugin Vite du consommateur sait résoudre.
      external: [
        'vue',
        /^@nuxt\/ui(\/.*)?$/,
        '@jsonforms/core',
        '@jsonforms/vue',
        // Externalisés pour éviter d'en embarquer un doublon : Nuxt UI fournit déjà
        // `@internationalized/date`, et `defu`/`radash` sont de l'ESM sans piège d'interop.
        '@internationalized/date',
        'defu',
        'radash',
        // `dayjs` est délibérément *inclus* dans le bundle : c'est du CommonJS, et le
        // laisser externe obligerait chaque application hôte à le déclarer dans
        // `optimizeDeps.include` pour que son export par défaut soit exposé. ~7 ko.
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
