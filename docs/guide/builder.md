# Builder visuel

```vue
<template lang="pug">
  form-builder(v-model="definition")
</template>

<script setup lang="ts">
import { FormBuilder, type FormDefinition } from '@ficsysfr/jsonforms_builder'

const definition = ref<Partial<FormDefinition>>({})
</script>
```

Le builder fournit :

- une **palette** de contrôles (saisie, choix, dates, structure) ;
- un **arbre** réordonnable (drag-and-drop) ;
- un **inspecteur** de propriétés et d’**options par composant** (communes + spécifiques : textarea, pin, date, enum, array, categorization, …) ;
- un **aperçu live** ;
- un **export JSON** de `{ data, schema, uischema }` ;
- un **import** (coller un JSON ou charger un fichier `.json`) pour éditer un formulaire existant ;
- une **sauvegarde automatique** du brouillon (`schema`, `uischema`, `data`) dans `localStorage` — désactivable avec `:storage-key="false"`.

Formats d’import acceptés :

- `{ "schema": …, "uischema": …, "data"?: … }` (`data` alimente l’aperçu) ;
- un **JSON Schema** seul — l’UI Schema est généré automatiquement.

Vous pouvez aussi l’ouvrir depuis le playground via **Open builder** (route `#/builder`, avec `?return=` pour revenir à la galerie).
