# Intégration

## Déclarer la bibliothèque à Tailwind (requis)

Tailwind 4 génère les utilitaires en scannant les sources du projet et **ignore tout ce qui est hors de sa racine** — y compris `node_modules`. Sans la ligne ci-dessous, les classes utilisées par les renderers apparaissent dans le DOM mais ne correspondent à aucune règle CSS.

```css
@import "tailwindcss";
@import "@nuxt/ui";

@source "../node_modules/@ficsysfr/jsonforms_builder/dist";
```

> Si votre thème de marque est déclaré dans un bloc `@theme`, utilisez **`@theme static`**.
> Tailwind élague les variables qu’aucune source ne référence directement, et une couleur
> consommée uniquement par le CSS généré de Nuxt UI
> (`--ui-primary: var(--color-my-color-500)`) disparaît silencieusement.

## Nuxt

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  vite: {
    optimizeDeps: {
      // La bibliothèque importe des SFC `@nuxt/ui` : le pré-bundler esbuild
      // ne peut pas les compiler, il faut l’exclure.
      exclude: ['@ficsysfr/jsonforms_builder'],
      // `ajv` est CommonJS. Sans pré-bundling, son export default n’est pas exposé
      // et `@jsonforms/core` échoue à l’import.
      include: ['ajv', 'ajv-formats', '@jsonforms/core', '@jsonforms/vue'],
    },
  },
})
```

> **Lors d’une mise à jour de la bibliothèque** — si le navigateur lève
> `does not provide an export named '…'` sur `@jsonforms/vue` ou `@jsonforms/core`,
> le pré-bundle Vite est périmé. Redémarrer avec un cache vidé suffit :
>
> ```bash
> rm -rf node_modules/.vite && vite --force
> ```

## Vue + Vite (sans Nuxt)

```ts
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), ui({ colorMode: true })],
})
```

Le renderer WYSIWYG exige aussi de **dédupliquer ProseMirror** — ses plugins sont identifiés par identité d’objet, et deux copies dans l’arbre de dépendances lèvent `Adding different instances of a keyed plugin` :

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

Voir `playground/vite.config.ts` pour une configuration commentée complète (y compris les stubs `#imports` requis par `@nuxt/icon` hors Nuxt).

## Icônes hors ligne et sous CSP

Sans configuration, Nuxt Icon télécharge les icônes depuis l’API Iconify, ce qu’une CSP
`connect-src 'self'` ou un usage hors ligne interdit. L’entrée sans dépendance
`@ficsysfr/jsonforms_builder/icons` liste les icônes Lucide affichées par la bibliothèque :
`CONTROL_ICONS` (contrôles et dispositions de `nuxtUiRenderers`), `WYSIWYG_ICONS`,
`BUILDER_ICONS` et leur union `LIBRARY_ICONS`.

```ts
import { CONTROL_ICONS } from '@ficsysfr/jsonforms_builder/icons'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  icon: {
    clientBundle: { icons: [...CONTROL_ICONS] },
  },
})
```

Ajouter les icônes propres aux composants Nuxt UI (`appConfig.ui.icons`) et celles que vos UI
schemas nomment (`leadingIcon`, `trailingIcon`).

## CSP stricte

`strictCspRenderers` rend sous une CSP sans `'unsafe-inline'`, sans `'unsafe-eval'`, sans `data:`
ni `blob:` (`script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'`). C'est
`nuxtUiRenderers` sans l’upload de fichier, dont l’aperçu d’image passe par une URL `blob:`
(`img-src blob:`). Les combinateurs `oneOf`, `anyOf` et `allOf` choisissent leur variante sans Ajv
et restent disponibles.

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

Deux chemins de JSON Forms compilent du code avec Ajv, refusé sans `'unsafe-eval'` :

- la validation : passer `validation-mode="NoValidation"` et fournir les erreurs par
  `additional-errors` ;
- les règles dont la condition porte un `schema` (`{ scope, schema }`) : écrire les règles avec des
  conditions `LEAF`, `AND`, `OR` ou par fonction.

Côté hôte, Nuxt UI demande encore :

- de déclarer les icônes (section précédente) et de les rendre en SVG (`icon.mode: 'svg'`) : le
  mode CSS de Nuxt Icon injecte un `<style>` ;
- d’autoriser par empreinte ou nonce le `<style>` de ses couleurs (`#nuxt-ui-colors`) ; en SPA,
  Nuxt UI pose aussi un style temporaire pendant l’hydratation, à couvrir de la même façon ;
- d’autoriser de même le script anti-flash du mode couleur s’il est activé ;
- d’éviter `content.position: 'item-aligned'` sur les listes de sélection : le viewport de Reka UI
  injecte alors un `<style>`.

`yarn test:browser` vérifie cette recette dans Chromium : formulaire complet servi sous cette CSP,
seule l’empreinte exacte du style de couleurs de Nuxt UI autorisée, chaque type de champ édité,
zéro violation et aucune requête hors origine, lecture seule et erreurs serveur comprises. Deux
contre-épreuves montrent que la validation Ajv et une règle à condition `schema` exigent
`'unsafe-eval'`.

## Problème amont connu — `subTree`

`@vueuse/core` 14.4.0 contient dans `onClickOutside` un accès non gardé à `vm.$`. Après un unmount, un clic qui atteint un listener survivant peut lever `Cannot read properties of null (reading 'subTree')`.

Le contournement appliqué dans les renderers concernés : différer la mutation qui unmount d’un `nextTick`, pour laisser le menu se fermer. Reproduisez dans l’app hôte si vous unmounttez des sous-arbres depuis un handler `@update:model-value`.
