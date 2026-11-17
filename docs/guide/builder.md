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
- une **sauvegarde du brouillon** (`schema`, `uischema`, `data`) dans `localStorage`, sur demande : `:storage-key="true"` (clé historique) ou `storage-key="ma-cle"`. Sans cette prop, rien n’est persisté : un brouillon peut contenir des données que l’hôte ne veut pas laisser dans le navigateur.

Formats d’import acceptés :

- `{ "schema": …, "uischema": …, "data"?: … }` (`data` alimente l’aperçu) ;
- un **JSON Schema** seul — l’UI Schema est généré automatiquement.

Vous pouvez aussi l’ouvrir depuis le playground via **Open builder** (route `#/builder`, avec `?return=` pour revenir à la galerie).
