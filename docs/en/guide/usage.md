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

## Interface language

The library's own texts (array buttons, confirmations, lists, dates, upload, WYSIWYG, builder) go
through the JSON Forms translator, under `jsonformsBuilder.*` keys. Without a translator they stay
in French. `createJsonFormsTranslator` provides French and English once given a `locale`, and
`messages` overrides any text:

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

A custom translator (a vue-i18n bridge, for instance) receives the same keys and returns
`undefined` for an unknown key: the French text then applies. `UI_MESSAGES`, exported by the
library, lists the keys. Calendars follow the `jsonformsBuilder.locale` key (`fr-FR`, `en-US`),
unless the control sets `options.locale`.
