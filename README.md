# JSON Forms Builder

[![CI](https://github.com/tacxou/jsonforms_builder/actions/workflows/ci.yml/badge.svg)](https://github.com/tacxou/jsonforms_builder/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/tacxou/jsonforms_builder/branch/main/graph/badge.svg)](https://codecov.io/gh/tacxou/jsonforms_builder)
![NPM Version](https://img.shields.io/npm/v/@tacxou/jsonforms_builder)
![NPM Downloads](https://img.shields.io/npm/dm/@tacxou/jsonforms_builder)
[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

![JSONForms Builder banner](static/banner.jpg)

Renderers [JSONForms](https://jsonforms.io/) pour Vue 3, bâtis sur **Nuxt UI 4** et **Tailwind CSS 4** — plus un **builder visuel** pour composer `{ schema, uischema }` sans écrire de JSON.

> **v2 — changement de socle.** La v1 reposait sur Quasar. La v2 rend en composants `U*` de Nuxt UI et hérite donc automatiquement du thème de l'application hôte. La branche `v1-quasar` conserve l'ancienne implémentation ; `@tacxou/jsonforms_builder@1.x` reste installable.

## Installation

```bash
yarn add @tacxou/jsonforms_builder @jsonforms/core @jsonforms/vue @nuxt/ui
```

`@nuxt/ui`, `@jsonforms/core`, `@jsonforms/vue` et `vue` sont des **peerDependencies** : la librairie n'embarque aucun composant Nuxt UI, elle les importe depuis l'installation de l'application.

## Utilisation

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

- `nuxtUiRenderers` — contrôles, layouts et éléments additionnels.
- `allRenderers` — idem, plus l'éditeur de texte riche (`UEditor`).

### Builder visuel

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@tacxou/jsonforms_builder'

const definition = ref<Partial<FormDefinition>>({})
</script>
```

Palette, arbre réordonnable par glisser-déposer, inspecteur de propriétés, aperçu live et export JSON. L'édition brute du JSON est laissée à l'application hôte (Monaco, CodeMirror…).

## Renderers

| Schéma / option | Composant Nuxt UI |
|---|---|
| `string` | `UInput` |
| `string` + `options.multi` | `UTextarea` |
| `string` + `format: password` | `UInput` + bascule de visibilité |
| `string` + `options.wysiwyg` | `UEditor` + `UEditorToolbar` |
| `number` / `integer` | `UInputNumber` |
| `number` + `options.slider` | `USlider` |
| `boolean` | `UCheckbox` (`USwitch` via `options.toggle`) |
| `enum` | `USelectMenu` |
| `enum` + `options.format: radio` | `URadioGroup` |
| `string` + `options.api` | `UInputMenu` (recherche distante) |
| `format: date` / `date-time` / `time` | `UInputDate` / `UInputTime` |
| `array` | cartes répétables (ajout, réordonnancement, suppression) |
| `oneOf` | sélecteur de variante + sous-formulaire |
| `Group` | `UCard` titrée |
| `Categorization` | `UTabs` (`UStepper` via `options.variant: "stepper"`) |
| `Label` | titre + `USeparator` |

### Personnalisation

Deux niveaux, du plus large au plus ciblé :

```ts
// 1. Thème global, injecté une fois pour toute l'arborescence.
provide('styles', { control: { input: 'font-mono' } })
```

```json
// 2. Par élément, via les options du uischema — `<slot>` est le composant visé.
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": { "input": { "size": "lg", "ui": { "base": "tracking-wide" } } }
}
```

## Intégration

### Déclarer la librairie à Tailwind (obligatoire)

Tailwind 4 génère ses utilitaires en scannant les sources du projet, et **ignore tout ce
qui se trouve hors de sa racine** — donc `node_modules`. Sans la ligne ci-dessous, les
classes employées par les renderers apparaissent bien dans le DOM mais ne correspondent à
aucune règle CSS : bordures et fonds de sélection disparaissent, l'espacement se décale.

```css
@import "tailwindcss";
@import "@nuxt/ui";

@source "../node_modules/@tacxou/jsonforms_builder/dist";
```

> Si votre thème de marque est déclaré dans un bloc `@theme`, utilisez **`@theme static`**.
> Tailwind élague les variables qu'aucune source ne référence directement, et une couleur
> consommée uniquement par le CSS généré de Nuxt UI (`--ui-primary: var(--color-ma-couleur-500)`)
> tombe silencieusement — le thème repasse alors aux couleurs par défaut.

### Nuxt

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  vite: {
    optimizeDeps: {
      // La librairie conserve des imports vers les SFC de `@nuxt/ui` : le pré-bundleur
      // esbuild ne sait pas les compiler, il faut donc l'en exclure.
      exclude: ['@tacxou/jsonforms_builder'],
      // `ajv` est du CommonJS. Sans pré-bundling, son export par défaut n'est pas exposé
      // et `@jsonforms/core` échoue à l'import.
      include: ['ajv', 'ajv-formats', '@jsonforms/core', '@jsonforms/vue'],
    },
  },
})
```

### Vue + Vite (sans Nuxt)

```ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), ui({ colorMode: true })],
})
```

Le renderer WYSIWYG exige en plus de **dédupliquer ProseMirror** — ses plugins sont identifiés par identité d'objet, et deux copies dans l'arbre de dépendances lèvent `Adding different instances of a keyed plugin` :

```ts
resolve: {
  dedupe: ['@tiptap/core', '@tiptap/pm', '@tiptap/vue-3', 'prosemirror-state', 'prosemirror-view', 'prosemirror-model'],
}
```

Voir `playground/vite.config.ts` pour une configuration complète et commentée (y compris les stubs `#imports` requis par `@nuxt/icon` hors Nuxt).

## Défaut amont connu — `Cannot read properties of null (reading 'subTree')`

`@vueuse/core` 14.4.0 (dernière version à ce jour, tirée par Nuxt UI) contient dans
`onClickOutside` :

```js
function hasMultipleRoots(target) {
  const vm = toValue(target)
  return vm && vm.$.subTree.shapeFlag === 16   // `vm` est protégé, `vm.$` ne l'est pas
}
```

Après démontage d'un composant, `vm.$` vaut `null` : tout clic ultérieur atteignant un
écouteur survivant lève l'erreur. Le cas déclenchant est **un menu ouvert dont le clic de
sélection démonte le sous-arbre** — typiquement un changement de variante `oneOf`, ou la
suppression d'une ligne de tableau.

La parade, appliquée dans les renderers concernés, est de différer d'un `nextTick` la
mutation qui démonte, afin que la fermeture du menu s'achève d'abord. À reproduire dans
l'application hôte si elle démonte elle-même des sous-arbres depuis un `@update:model-value`.

## Développement

Ce projet tourne sur **Node.js ≥ 22** avec **Yarn** (Classic 1.x, cf. `packageManager`)
comme unique gestionnaire de paquets : c'est `yarn.lock` qui fait foi, n'installez pas
avec `npm` ou `pnpm`.

```bash
yarn install
yarn start:dev        # playground : galerie d'exemples + builder
yarn build            # build de la librairie (es + cjs + déclarations)
yarn test             # suite Vitest
yarn test:watch       # idem, en mode veille
yarn test:coverage    # couverture v8 → ./coverage/lcov.info
yarn lint             # Biome : lint + vérification du formatage
yarn lint:fix         # applique les corrections sûres et reformate
```

Le lint et le formatage sont assurés par **[Biome](https://biomejs.dev/)** (`biome.jsonc`),
qui remplace ESLint et Prettier. Deux limites tiennent au socle Vue + Pug :

- Biome n'analyse que le bloc `<script>` d'un SFC, jamais le `<template>`. Les règles
  `noUnusedVariables` et `noUnusedImports` sont donc désactivées sur les `.vue`, où toute
  liaison consommée par le template passerait pour inutilisée.
- Le formatage ne touche pas les templates Pug, laissés à `.editorconfig`.

![Alt](https://repobeats.axiom.co/api/embed/a6c9d83d94634994e69a4302a2329c934a2cbcd6.svg "Repobeats analytics image")
