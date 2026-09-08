# Installation

```bash
yarn add @ficsysfr/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

Version 2.0.2 moved the maintained v2 package from `@tacxou` to `@ficsysfr`; public exports are
unchanged apart from the import path.

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` and `vue` are **peerDependencies**: the library bundles no Nuxt UI component of its own; it imports them from the host application’s installation.

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
