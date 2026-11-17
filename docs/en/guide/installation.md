# Installation

```bash
yarn add @ficsysfr/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

Version 2.0.2 moved the maintained v2 package from `@tacxou` to `@ficsysfr`; public exports are
unchanged apart from the import path.

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` and `vue` are **peerDependencies**: the library bundles no Nuxt UI component of its own; it imports them from the host application’s installation.

`typescript` is an **optional** peerDependency (`^5 || ^6 || ^7`): it only matters for the
host’s type-checking or the `./source` export, never at runtime.

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
