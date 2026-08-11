# Visual builder

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@tacxou/jsonforms_builder'

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
- an **automatic draft save** (`schema`, `uischema`, `data`) in `localStorage` — disable it with `:storage-key="false"`.

Accepted import formats:

- `{ "schema": …, "uischema": …, "data"?: … }` (`data` feeds the preview);
- a standalone **JSON Schema** — the UI Schema is generated automatically.

You can also open it from the playground through **Open builder** (route `#/builder`, with `?return=` to get back to the gallery).
