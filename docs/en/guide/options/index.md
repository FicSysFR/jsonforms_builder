# Options API

All options go into `uischema.options` (merged with `config` through `defu`). The table layout follows the Quasar / Vuetify model:

| Column | Meaning |
|---|---|
| **Name** | Key in `options` (or nested path) |
| **Type** | Expected type |
| **Default** | Default value (`—` = none) |
| **Description** | Behaviour |

Each section ends with one or more ready-to-paste JSON **examples**.

## Navigation

| Control | Page |
|---|---|
| Common options (all fields) | [Common](./common) |
| String, textarea, password, pin, color, file, API, WYSIWYG | [Text & media](./string) |
| Number, slider, rating | [Numbers](./number) |
| Boolean | [Boolean](./boolean) |
| Enum, select, radio, multi-enum | [Enums](./enum) |
| Date, time, calendar | [Dates](./date) |
| Array, tags, object, oneOf | [Arrays & objects](./array) |
| Group, Categorization, Label | [Layouts](./layouts) |
| Nuxt UI pass-through (`input`, `formField`, …) | [Pass-through](./pass-through) |

## Placement

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "placeholder": "Your name…",
    "input": { "size": "lg" }
  }
}
```

Options can also be supplied globally through the `config` prop of `JsonForms` — control-local options win.

## Playground

The interactive Nuxt UI showcases (Documentation tab) are listed in [Nuxt UI playground examples](/en/guide/playground-examples). Each options page below also points to its live showcase.
