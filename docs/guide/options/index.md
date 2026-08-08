# Options API

Toutes les options se placent dans `uischema.options` (fusionnées avec `config` via `defu`). La structure des tableaux suit le modèle Quasar / Vuetify :

| Colonne | Signification |
|---|---|
| **Name** | Clé dans `options` (ou chemin imbriqué) |
| **Type** | Type attendu |
| **Default** | Valeur par défaut (`—` = aucune) |
| **Description** | Comportement |

Chaque section se termine par un ou plusieurs **exemples** JSON prêts à coller.

## Navigation

| Contrôle | Page |
|---|---|
| Options communes (tous les champs) | [Communes](./common) |
| String, textarea, password, pin, color, file, API, WYSIWYG | [Texte & médias](./string) |
| Number, slider, rating | [Nombres](./number) |
| Boolean | [Booléen](./boolean) |
| Enum, select, radio, multi-enum | [Enumérations](./enum) |
| Date, time, calendar | [Dates](./date) |
| Array, tags, object, oneOf | [Tableaux & objets](./array) |
| Group, Categorization, Label | [Layouts](./layouts) |
| Pass-through Nuxt UI (`input`, `formField`, …) | [Pass-through](./pass-through) |

## Emplacement

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "placeholder": "Votre nom…",
    "input": { "size": "lg" }
  }
}
```

Les options peuvent aussi être fournies globalement via la prop `config` de `JsonForms` — les options locales au contrôle priment.
