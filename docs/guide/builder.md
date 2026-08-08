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

- une **palette** de contrôles (saisie, choix, dates, structure) ;
- un **arbre** réordonnable (drag-and-drop) ;
- un **inspecteur** de propriétés et d’**options par composant** (communes + spécifiques : textarea, pin, date, enum, array, categorization, …) ;
- un **aperçu live** ;
- un **export JSON** de `{ schema, uischema }` ;
- un **import** (coller un JSON ou charger un fichier `.json`) pour éditer un formulaire existant.

Formats d’import acceptés :

- `{ "schema": …, "uischema": … }` (les autres clés comme `data` sont ignorées) ;
- un **JSON Schema** seul — l’UI Schema est généré automatiquement.

Vous pouvez aussi l’ouvrir depuis le playground via le bouton **Open builder**.
