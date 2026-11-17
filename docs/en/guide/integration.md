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

## Offline icons and CSP

By default Nuxt Icon fetches icons from the Iconify API, which a `connect-src 'self'` CSP or an
offline app forbids. The dependency-free entry `@ficsysfr/jsonforms_builder/icons` lists the Lucide
icons the library displays: `CONTROL_ICONS` (controls and layouts of `nuxtUiRenderers`),
`WYSIWYG_ICONS`, `BUILDER_ICONS` and their union `LIBRARY_ICONS`.

```ts
import { CONTROL_ICONS } from '@ficsysfr/jsonforms_builder/icons'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  icon: {
    clientBundle: { icons: [...CONTROL_ICONS] },
  },
})
```

Add Nuxt UI's own component icons (`appConfig.ui.icons`) and the icons your UI schemas name
(`leadingIcon`, `trailingIcon`).

## Strict CSP

`strictCspRenderers` renders under a CSP without `'unsafe-inline'`, `'unsafe-eval'`, `data:` or
`blob:` (`script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'`). It is
`nuxtUiRenderers` minus file upload, whose image preview uses a `blob:` URL (`img-src blob:`). The
`oneOf`, `anyOf` and `allOf` combinators pick their variant without Ajv and stay available.

```vue
<json-forms
  :schema="schema"
  :uischema="uischema"
  :data="data"
  :renderers="strictCspRenderers"
  validation-mode="NoValidation"
  :additional-errors="serverErrors"
  @change="onChange"
/>
```

Two JSON Forms paths compile code with Ajv, which a CSP without `'unsafe-eval'` refuses:

- validation: pass `validation-mode="NoValidation"` and supply errors through `additional-errors`;
- rules whose condition carries a `schema` (`{ scope, schema }`): write rules with `LEAF`, `AND`,
  `OR` or function conditions.

On the host side, Nuxt UI still needs:

- the icons declared (previous section) and rendered as SVG (`icon.mode: 'svg'`): Nuxt Icon's CSS
  mode injects a `<style>`;
- its colors `<style>` (`#nuxt-ui-colors`) allowed by hash or nonce; in a SPA, Nuxt UI also adds a
  temporary style during hydration, to cover the same way;
- the color-mode anti-flash script allowed likewise when enabled;
- no `content.position: 'item-aligned'` on select menus: Reka UI's viewport then injects a
  `<style>`.

`yarn test:browser` checks this recipe in Chromium: a complete form served under that CSP, with
only the exact hash of Nuxt UI's colors style allowed, every kind of field edited, zero violations
and no request leaving the origin, read-only mode and server errors included. Two counter-tests
show that Ajv validation and a rule with a `schema` condition need `'unsafe-eval'`.

## Known upstream issue — `subTree`

`@vueuse/core` 14.4.0 has an unguarded access to `vm.$` inside `onClickOutside`. After an unmount, a click reaching a surviving listener can throw `Cannot read properties of null (reading 'subTree')`.

The workaround applied in the affected renderers: defer the unmounting mutation by one `nextTick`, so the menu can close first. Reproduce it in the host app if you unmount subtrees from an `@update:model-value` handler.
