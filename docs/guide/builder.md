# Builder visuel

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@tacxou/jsonforms_builder'

const definition = ref<Partial<FormDefinition>>({})
</script>
```

Le builder fournit :

- une **palette** de contrôles ;
- un **arbre** réordonnable (drag-and-drop) ;
- un **inspecteur** de propriétés ;
- un **aperçu live** ;
- un **export JSON** de `{ schema, uischema }`.

L’édition JSON brute est laissée à l’application hôte (Monaco, CodeMirror…).

Vous pouvez aussi l’ouvrir depuis le playground via le bouton **Open builder**.
