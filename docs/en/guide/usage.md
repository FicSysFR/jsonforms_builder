# Usage

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

- `nuxtUiRenderers` — controls, layouts and additional elements.
- `allRenderers` — the same, plus the rich text editor (`UEditor`).

## Typical data

```ts
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    active: { type: 'boolean', title: 'Active' },
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

Explore ready-made forms in the [playground](/en/playground): the **Documentation** tab for control showcases, the **Examples** tab for JSONForms demos.

Full option reference: [Options API](/en/guide/options/) (tables + examples).
