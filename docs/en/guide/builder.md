# Visual builder

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@ficsysfr/jsonforms_builder'

const definition = ref<Partial<FormDefinition>>({})
</script>
```

The builder provides:

- a **palette** of controls (input, choice, dates, structure);
- a reorderable **tree** (drag-and-drop);
- an **inspector** for properties and **per-component options** (common + specific: textarea, pin, date, enum, array, categorization, …);
- a **live preview**;
- a **JSON export** of `{ data, schema, uischema }`;
- an **import** (paste JSON or load a `.json` file) to edit an existing form;
- a **draft save** (`schema`, `uischema`, `data`) in `localStorage`, on request: `:storage-key="true"` (historical key) or `storage-key="my-key"`. Without that prop nothing is persisted: a draft may hold data the host does not want left in the browser.

Accepted import formats:

- `{ "schema": …, "uischema": …, "data"?: … }` (`data` feeds the preview);
- a standalone **JSON Schema** — the UI Schema is generated automatically.

The `locale` prop (`fr`, `en`, `en-GB`…) sets the interface language of the builder (palette, inspector, import, confirmations, default labels of new fields) and of its preview, through `createJsonFormsTranslator({ locale })`: `form-builder(v-model="definition" locale="en")`. Without `locale` or `translate`, the texts stay in French.

The `translate` prop takes a JSON Forms translator (`createJsonFormsTranslator({ locale, messages })`, a vue-i18n bridge…) and wins over `locale`. It is asked for the `jsonformsBuilder.builder.*` keys (listed in `UI_MESSAGES`); a key it returns `undefined` for keeps its French text. The preview gets the same translator.

You can also open it from the playground through **Open builder** (route `#/builder`, with `?return=` to get back to the gallery).
