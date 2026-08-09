# JSON Forms Builder

[![CI](https://github.com/tacxou/jsonforms_builder/actions/workflows/ci.yml/badge.svg)](https://github.com/tacxou/jsonforms_builder/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-00A86B)](https://tacxou.github.io/jsonforms_builder/)
[![codecov](https://codecov.io/gh/tacxou/jsonforms_builder/branch/main/graph/badge.svg)](https://codecov.io/gh/tacxou/jsonforms_builder)
![NPM Version](https://img.shields.io/npm/v/@tacxou/jsonforms_builder)
![NPM Downloads](https://img.shields.io/npm/dm/@tacxou/jsonforms_builder)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

![JSONForms Builder banner](static/banner.jpg)

[JSONForms](https://jsonforms.io/) renderers for Vue 3, built on **Nuxt UI 4** and **Tailwind CSS 4** — plus a **visual builder** to compose `{ schema, uischema }` without writing JSON by hand.

> **v2 — stack change.** v1 was based on Quasar. v2 renders with Nuxt UI `U*` components and therefore inherits the host app theme automatically. The `v1-quasar` branch keeps the old implementation; `@tacxou/jsonforms_builder@1.x` remains installable.

## Installation

```bash
yarn add @tacxou/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue`, and `vue` are **peerDependencies**: the library does not ship any Nuxt UI components; it imports them from the host app installation.

## Usage

```vue
<template lang="pug">
  json-forms(
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="renderers"
    validation-mode="ValidateAndShow"
    @change="onChange"
  )
</template>

<script setup lang="ts">
import { JsonForms } from '@jsonforms/vue'
import { nuxtUiRenderers } from '@tacxou/jsonforms_builder'

const renderers = Object.freeze(nuxtUiRenderers)
</script>
```

- `nuxtUiRenderers` — controls, layouts, and additional elements.
- `allRenderers` — the same, plus the rich-text editor (`UEditor`).

### Visual builder

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@tacxou/jsonforms_builder'

const definition = ref<Partial<FormDefinition>>({})
</script>
```

Palette, drag-and-drop reorderable tree, property inspector, live preview, and JSON export. Raw JSON editing is left to the host app (Monaco, CodeMirror…).

## Renderers

| Schema / option | Nuxt UI component |
|---|---|
| `string` | `UInput` |
| `string` + `options.multi` | `UTextarea` |
| `string` + `format: password` | `UInput` + visibility toggle |
| `object` / `string` + `options.wysiwyg` | `UEditor` (JSON or HTML via `contentType`) |
| WYSIWYG images | upload dropzone, drag-resize, bubble replace/delete |

WYSIWYG options (`options.wysiwyg: true`):

| Option | Role |
|---|---|
| `contentType` | `'json'` \| `'html'` (else inferred from schema) |
| `toolbar` | Nuxt UI toolbar groups, or `false` to hide |
| `density` | `'compact'` \| `'comfortable'` \| `'prose'` |
| `minHeight` / `padding` / `blockSpacing` / `editorClass` | spacing overrides |
| `debounce` | `onChange` debounce in ms (default `300`) |
| `image` | `false` to disable, or `{ upload, accept, maxSize, resize, bubble, … }` |
| `extensions` / `handlers` | extra TipTap extensions / Nuxt UI handlers |

```ts
options: {
  wysiwyg: true,
  contentType: 'html',
  density: 'comfortable',
  image: {
    upload: async (file) => uploadedUrl,
    maxSize: 5 * 1024 * 1024,
    resize: { minWidth: 80, alwaysPreserveAspectRatio: true },
  },
}
```
| `string` + `options.format: pin` | `UPinInput` |
| `string` + `format: color` | `UColorPicker` in a popover + text input |
| `string` + `format: data-url` | `UFileUpload` |
| `number` / `integer` | `UInputNumber` |
| `number` + `options.slider` | `USlider` |
| `number` + `options.format: rating` | `UInputRating` |
| `boolean` | `UCheckbox` (`USwitch` via `options.toggle`) |
| `enum` | `USelectMenu` |
| `enum` + `options.format: select` | `USelect` (no search) |
| `enum` + `options.format: radio` | `URadioGroup` |
| `string` + `options.api` | `UInputMenu` (remote search) |
| `format: date` / `date-time` / `time` | `UInputDate` / `UInputTime` |
| `format: date` + `options.format: calendar` | expanded `UCalendar` |
| `array` of `string` + `options.format: tags` | `UInputTags` |
| `array` | repeatable cards (add, reorder, remove) |
| `oneOf` | variant selector + sub-form |
| `Group` | titled `UCard` |
| `Categorization` | `UTabs` (`UStepper` via `options.variant: "stepper"`) |
| `Label` | heading + `USeparator` |

### Customization

Two levels, from broadest to most specific:

```ts
// 1. Global theme, injected once for the whole tree.
provide('styles', { control: { input: 'font-mono' } })
```

```json
// 2. Per element, via uischema options — `<slot>` is the target component.
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": { "input": { "size": "lg", "ui": { "base": "tracking-wide" } } }
}
```

## Integration

### Declare the library to Tailwind (required)

Tailwind 4 generates utilities by scanning project sources and **ignores everything
outside its root** — including `node_modules`. Without the line below, classes used by
the renderers appear in the DOM but map to no CSS rule: selection borders and backgrounds
disappear, and spacing shifts.

```css
@import "tailwindcss";
@import "@nuxt/ui";

@source "../node_modules/@tacxou/jsonforms_builder/dist";
```

> If your brand theme is declared in an `@theme` block, use **`@theme static`**.
> Tailwind prunes variables that no source references directly, and a color consumed
> only by Nuxt UI's generated CSS (`--ui-primary: var(--color-my-color-500)`)
> silently falls away — the theme then reverts to default colors.

### Nuxt

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  vite: {
    optimizeDeps: {
      // The library keeps imports into `@nuxt/ui` SFCs: esbuild's pre-bundler
      // cannot compile them, so exclude it.
      exclude: ['@tacxou/jsonforms_builder'],
      // `ajv` is CommonJS. Without pre-bundling, its default export is not exposed
      // and `@jsonforms/core` fails on import.
      include: ['ajv', 'ajv-formats', '@jsonforms/core', '@jsonforms/vue'],
    },
  },
})
```

> **When updating the library** — if the browser throws
> `does not provide an export named '…'` on `@jsonforms/vue` or `@jsonforms/core`,
> Vite's pre-bundle is stale: a new version may import from an *already optimized*
> dependency an export it did not import before, and Vite does not always invalidate
> its cache. A restart with a cleared cache is enough:
>
> ```bash
> rm -rf node_modules/.vite && vite --force
> ```

### Vue + Vite (without Nuxt)

```ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), ui({ colorMode: true })],
})
```

The WYSIWYG renderer also requires **deduplicating ProseMirror** — its plugins are identified by object identity, and two copies in the dependency tree throw `Adding different instances of a keyed plugin`:

```ts
resolve: {
  dedupe: ['@tiptap/core', '@tiptap/pm', '@tiptap/vue-3', 'prosemirror-state', 'prosemirror-view', 'prosemirror-model'],
}
```

See `playground/vite.config.ts` for a full commented configuration (including the `#imports` stubs required by `@nuxt/icon` outside Nuxt).

## Known upstream default — `Cannot read properties of null (reading 'subTree')`

`@vueuse/core` 14.4.0 (latest as of writing, pulled by Nuxt UI) contains in
`onClickOutside`:

```js
function hasMultipleRoots(target) {
  const vm = toValue(target)
  return vm && vm.$.subTree.shapeFlag === 16   // `vm` is guarded, `vm.$` is not
}
```

After a component unmounts, `vm.$` is `null`: any later click that reaches a surviving
listener throws. The triggering case is **an open menu whose selection click unmounts
the subtree** — typically a `oneOf` variant change, or removing an array row.

The workaround applied in the affected renderers is to defer the unmounting mutation by
one `nextTick`, so the menu can finish closing first. Reproduce this in the host app if
it unmounts subtrees itself from an `@update:model-value` handler.

## Development

This project runs on **Node.js ≥ 22** with **Yarn** (Classic 1.x, see `packageManager`)
as the sole package manager: `yarn.lock` is authoritative — do not install with
`npm` or `pnpm`.

```bash
yarn install
yarn start:dev        # playground: documentation + examples + builder
yarn docs:dev         # VitePress documentation site (local)
yarn docs:build       # build docs + playground for GitHub Pages
yarn build            # library build (es + cjs + declarations)
yarn test             # Vitest suite
yarn test:watch       # same, watch mode
yarn test:coverage    # v8 coverage → ./coverage/lcov.info
yarn lint             # Biome: lint + format check
yarn lint:fix         # apply safe fixes and reformat
```

### Documentation site (GitHub Pages)

The VitePress site in `docs/` is published to
[GitHub Pages](https://tacxou.github.io/jsonforms_builder/) and embeds the
interactive playground.

In the playground sidebar:

- **Documentation** — Nuxt UI control showcases (`nuxt-*`, control options, …)
- **Examples** — JSONForms demos, layouts, compositions, and edge cases

Enable Pages in the repository settings (**Settings → Pages → Source: GitHub Actions**).
The workflow `.github/workflows/deploy-docs.yml` builds and deploys on every push to `main`.

Linting and formatting are handled by **[Biome](https://biomejs.dev/)** (`biome.jsonc`),
replacing ESLint and Prettier. Two limits come from the Vue + Pug stack:

- Biome only analyzes an SFC's `<script>` block, never the `<template>`. The
  `noUnusedVariables` and `noUnusedImports` rules are therefore disabled on `.vue` files,
  where any binding consumed by the template would look unused.
- Formatting does not touch Pug templates, which are left to `.editorconfig`.

![Alt](https://repobeats.axiom.co/api/embed/a6c9d83d94634994e69a4302a2329c934a2cbcd6.svg "Repobeats analytics image")
