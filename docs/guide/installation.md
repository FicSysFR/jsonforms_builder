# Installation

```bash
yarn add @tacxou/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` et `vue` sont des **peerDependencies** : la bibliothèque n’embarque aucun composant Nuxt UI ; elle les importe depuis l’installation de l’application hôte.

## Prérequis

- Node.js ≥ 22
- Vue 3.5+
- Tailwind CSS 4 (via `@nuxt/ui`)

## Versions

| Paquet | Stack |
|---|---|
| `@tacxou/jsonforms_builder@2.x` | Nuxt UI 4 + Tailwind 4 |
| `@tacxou/jsonforms_builder@1.x` | Quasar (branche `v1-quasar`) |

> **v2 — changement de stack.** v1 était basé sur Quasar. v2 rend avec les composants Nuxt UI `U*` et hérite donc automatiquement du thème de l’app hôte.
