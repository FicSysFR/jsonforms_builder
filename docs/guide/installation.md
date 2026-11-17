# Installation

```bash
yarn add @ficsysfr/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

Depuis la version 2.0.2, le paquet v2 maintenu est passé du scope `@tacxou` au scope `@ficsysfr` ;
les exports publics restent identiques en dehors du chemin d'import.

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` et `vue` sont des **peerDependencies** : la bibliothèque n’embarque aucun composant Nuxt UI ; elle les importe depuis l’installation de l’application hôte.

`typescript` est une peerDependency **optionnelle** (`^5 || ^6 || ^7`) : elle ne sert qu’au
contrôle de types de l’hôte ou à l’export `./source`, et n’est jamais requise à l’exécution.

## Points d’entrée

| Import | Contenu |
|---|---|
| `@ficsysfr/jsonforms_builder` | Tout : rétrocompatible, exige les paquets Tiptap au build. |
| `@ficsysfr/jsonforms_builder/core` | Contrôles, dispositions, composables, i18n, thème, icônes, `nuxtUiRenderers`, `strictCspRenderers`. N’importe aucun paquet Tiptap. |
| `@ficsysfr/jsonforms_builder/advanced` | Renderer WYSIWYG, assistant IA, `advancedRenderers`, `allRenderers` (Tiptap). |
| `@ficsysfr/jsonforms_builder/builder` | Constructeur visuel `<FormBuilder>` et ses utilitaires. |
| `@ficsysfr/jsonforms_builder/icons` | Listes d’icônes, sans dépendance (importable depuis `nuxt.config`). |

Le paquet déclare `"sideEffects": false` : un bundler élimine ce qu’une page n’utilise pas. Un
formulaire sans texte riche importe `./core` et charge ainsi environ un tiers de code en moins
qu’avec l’ancien build en un seul fichier.

## Licences

La bibliothèque est sous licence BSD-3-Clause (`LICENSE`). Le paquet npm livre aussi
`THIRD_PARTY_NOTICES.md` : notices MIT du code dérivé de JSON Forms et de Day.js, embarqué dans
`dist/`. Une application qui redistribue la bibliothèque reproduit ces deux fichiers dans ses
notices tierces.

## Prérequis

- Node.js ≥ 22
- Vue 3.5+
- Tailwind CSS 4 (via `@nuxt/ui`)

## Versions

| Paquet | Stack |
|---|---|
| `@ficsysfr/jsonforms_builder@2.x` | Nuxt UI 4 + Tailwind 4 |
| `@tacxou/jsonforms_builder@1.x` | Quasar (branche `v1-quasar`) |

> **v2 — changement de stack.** v1 était basé sur Quasar. v2 rend avec les composants Nuxt UI `U*` et hérite donc automatiquement du thème de l’app hôte.
