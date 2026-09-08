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
