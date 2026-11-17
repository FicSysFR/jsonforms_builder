# Installation

```bash
yarn add @ficsysfr/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

Version 2.0.2 moved the maintained v2 package from `@tacxou` to `@ficsysfr`; public exports are
unchanged apart from the import path.

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` and `vue` are **peerDependencies**: the library bundles no Nuxt UI component of its own; it imports them from the host application’s installation.

`typescript` is an **optional** peerDependency (`^5 || ^6 || ^7`): it only matters for the
host’s type-checking or the `./source` export, never at runtime.

The WYSIWYG renderer (`./advanced`) imports `@tiptap/core`, `@tiptap/pm`, `@tiptap/vue-3` and
`@tiptap/extension-image`, which Nuxt UI already provides: they are optional peerDependencies
(`^3.30.5`). With strict pnpm, declare them in the application to share Nuxt UI's instance.
`./core` does not need them.

## Entry points

| Import | Content |
|---|---|
| `@ficsysfr/jsonforms_builder` | Everything: backward compatible, needs the Tiptap packages at build time. |
| `@ficsysfr/jsonforms_builder/core` | Controls, layouts, composables, i18n, theme, icons, `nuxtUiRenderers`, `strictCspRenderers`. Imports no Tiptap package. |
| `@ficsysfr/jsonforms_builder/advanced` | WYSIWYG renderer, AI assistant, `advancedRenderers`, `allRenderers` (Tiptap). |
| `@ficsysfr/jsonforms_builder/builder` | Visual `<FormBuilder>` and its helpers. |
| `@ficsysfr/jsonforms_builder/icons` | Icon lists, dependency-free (importable from `nuxt.config`). |

The package declares `"sideEffects": false`: a bundler drops what a page does not use. A form
without rich text imports `./core` and so loads about a third less code than with the former
single-file build.

## Licenses

The library is BSD-3-Clause licensed (`LICENSE`). The npm package also ships
`THIRD_PARTY_NOTICES.md`: the MIT notices of the code derived from JSON Forms and of Day.js, which
is bundled into `dist/`. An application that redistributes the library reproduces both files in
its third-party notices.

## Requirements

- Node.js ≥ 22
- Vue 3.5+
- Tailwind CSS 4 (through `@nuxt/ui`)

## Versions

| Package | Stack |
|---|---|
| `@ficsysfr/jsonforms_builder@2.x` | Nuxt UI 4 + Tailwind 4 |
| `@tacxou/jsonforms_builder@1.x` | Quasar (`v1-quasar` branch) |

> **v2 — stack change.** v1 was built on Quasar. v2 renders with the Nuxt UI `U*` components and therefore inherits the host app’s theme automatically.
