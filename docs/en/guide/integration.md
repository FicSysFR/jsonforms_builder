# Integration

## Declare the library to Tailwind (required)

Tailwind 4 generates utilities by scanning the project sources and **ignores anything outside its root** — including `node_modules`. Without the line below, the classes used by the renderers show up in the DOM but match no CSS rule.

```css
@import "tailwindcss";
@import "@nuxt/ui";

@source "../node_modules/@ficsysfr/jsonforms_builder/dist";
```

> If your brand theme is declared in a `@theme` block, use **`@theme static`**.
> Tailwind prunes variables that no source references directly, and a color
> consumed only by Nuxt UI’s generated CSS
> (`--ui-primary: var(--color-my-color-500)`) disappears silently.

## Nuxt

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  vite: {
    optimizeDeps: {
      // The library imports `@nuxt/ui` SFCs: the esbuild pre-bundler
      // cannot compile them, so it has to be excluded.
      exclude: ['@ficsysfr/jsonforms_builder'],
      // `ajv` is CommonJS. Without pre-bundling its default export is not exposed
      // and `@jsonforms/core` fails on import.
      include: ['ajv', 'ajv-formats', '@jsonforms/core', '@jsonforms/vue'],
    },
  },
})
```

> **When upgrading the library** — if the browser throws
> `does not provide an export named '…'` on `@jsonforms/vue` or `@jsonforms/core`,
> the Vite pre-bundle is stale. Restarting with a cleared cache is enough:
>
> ```bash
> rm -rf node_modules/.vite && vite --force
> ```

## Vue + Vite (without Nuxt)

```ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), ui({ colorMode: true })],
})
```

The WYSIWYG renderer also requires **deduplicating ProseMirror** — its plugins are identified by object identity, and two copies in the dependency tree throw `Adding different instances of a keyed plugin`:

```ts
resolve: {
  dedupe: [
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/vue-3',
    'prosemirror-state',
    'prosemirror-view',
    'prosemirror-model',
  ],
}
```

See `playground/vite.config.ts` for a full commented configuration (including the `#imports` stubs `@nuxt/icon` needs outside Nuxt).

## Known upstream issue — `subTree`

`@vueuse/core` 14.4.0 has an unguarded access to `vm.$` inside `onClickOutside`. After an unmount, a click reaching a surviving listener can throw `Cannot read properties of null (reading 'subTree')`.

The workaround applied in the affected renderers: defer the unmounting mutation by one `nextTick`, so the menu can close first. Reproduce it in the host app if you unmount subtrees from an `@update:model-value` handler.
