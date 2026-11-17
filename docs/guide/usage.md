# Utilisation

## Renderers

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
import { nuxtUiRenderers } from '@ficsysfr/jsonforms_builder'

const renderers = Object.freeze(nuxtUiRenderers)
</script>
```

- `nuxtUiRenderers` — contrôles, layouts et éléments additionnels.
- `allRenderers` — les mêmes, plus l’éditeur riche (`UEditor`).

## Données typiques

```ts
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Nom' },
    active: { type: 'boolean', title: 'Actif' },
  },
}

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name' },
    { type: 'Control', scope: '#/properties/active', options: { toggle: true } },
  ],
}

const data = ref({ name: '', active: false })
```

Explorez les formulaires prêts à l’emploi dans le [playground](/playground) : l’onglet **Documentation** pour les vitrines de contrôles, l’onglet **Examples** pour les démos JSONForms.

Référence complète des options : [Options API](/guide/options/) (tableaux + exemples).

## Langue de l’interface

Les textes propres à la bibliothèque (boutons des tableaux, confirmations, listes, dates, upload,
WYSIWYG, constructeur) passent par le traducteur JSON Forms, sous des clés `jsonformsBuilder.*`.
Sans traducteur, ils restent en français. `createJsonFormsTranslator` fournit le français et
l’anglais dès qu’on lui donne une `locale`, et `messages` remplace n’importe quel texte :

```ts
const i18n = {
  locale: 'en',
  translate: createJsonFormsTranslator({
    locale: 'en',
    messages: { jsonformsBuilder: { array: { add: 'New row' } } },
  }),
}
```

```vue
<json-forms :i18n="i18n" … />
```

Un traducteur maison (pont vue-i18n, par exemple) reçoit les mêmes clés et renvoie `undefined`
pour une clé inconnue : le texte français s’applique alors. La liste des clés se trouve dans
`UI_MESSAGES`, exporté par la bibliothèque. La locale des calendriers suit la clé
`jsonformsBuilder.locale` (`fr-FR`, `en-US`), sauf `options.locale` sur le contrôle.
