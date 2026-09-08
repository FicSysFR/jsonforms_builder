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

## Problème amont connu — `subTree`

`@vueuse/core` 14.4.0 contient dans `onClickOutside` un accès non gardé à `vm.$`. Après un unmount, un clic qui atteint un listener survivant peut lever `Cannot read properties of null (reading 'subTree')`.

Le contournement appliqué dans les renderers concernés : différer la mutation qui unmount d’un `nextTick`, pour laisser le menu se fermer. Reproduisez dans l’app hôte si vous unmounttez des sous-arbres depuis un handler `@update:model-value`.
