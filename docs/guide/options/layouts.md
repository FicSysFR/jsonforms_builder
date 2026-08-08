# Layouts

---

## Group — `UCard`

**Activation :** élément UISchema `type: "Group"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `card` | `Object` | — | Pass-through → `UCard` (`variant`, `ui`, …). |

Le `label` du Group devient le titre de la carte.

### Exemple

```json
{
  "type": "Group",
  "label": "Coordonnées",
  "elements": [
    { "type": "Control", "scope": "#/properties/email" },
    { "type": "Control", "scope": "#/properties/phone" }
  ],
  "options": {
    "card": { "variant": "subtle" }
  }
}
```

---

## Categorization — `UTabs` / `UStepper`

**Activation :** `type: "Categorization"` avec des enfants `Category`.

### API (sur Categorization)

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `"stepper"` | tabs | `"stepper"` → wizard `UStepper` ; sinon `UTabs`. |
| `queryKey` | `String` | `"tab"` | Clé du hash / query pour mémoriser l’onglet. |
| `defaultTab` | `String` | `"0"` | Identifiant d’onglet initial. |
| `tabs` | `Object` | — | Pass-through → `UTabs`. |
| `stepper` | `Object` | — | Pass-through → `UStepper`. |

### API (sur Category)

| Name | Type | Default | Description |
|---|---|---|---|
| `queryId` | `String` | index | Identifiant stable pour le hash URL. |

### Exemples

Onglets :

```json
{
  "type": "Categorization",
  "options": { "queryKey": "section", "defaultTab": "basic" },
  "elements": [
    {
      "type": "Category",
      "label": "Base",
      "options": { "queryId": "basic" },
      "elements": [
        { "type": "Control", "scope": "#/properties/name" }
      ]
    },
    {
      "type": "Category",
      "label": "Avancé",
      "options": { "queryId": "advanced" },
      "elements": [
        { "type": "Control", "scope": "#/properties/notes" }
      ]
    }
  ]
}
```

Stepper :

```json
{
  "type": "Categorization",
  "options": {
    "variant": "stepper",
    "stepper": { "size": "md" }
  },
  "elements": [
    {
      "type": "Category",
      "label": "Étape 1",
      "elements": [{ "type": "Control", "scope": "#/properties/a" }]
    },
    {
      "type": "Category",
      "label": "Étape 2",
      "elements": [{ "type": "Control", "scope": "#/properties/b" }]
    }
  ]
}
```

---

## VerticalLayout / HorizontalLayout

Pas d’options métier dédiées. Le thème Tailwind se surcharge via `options.styles` ou `provide('styles', …)` (`verticalLayout` / `horizontalLayout`).

### Exemple

```json
{
  "type": "HorizontalLayout",
  "elements": [
    { "type": "Control", "scope": "#/properties/firstName" },
    { "type": "Control", "scope": "#/properties/lastName" }
  ]
}
```

---

## Label

**Activation :** `type: "Label"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `level` | `1`–`6` | `3` | Niveau de titre HTML (`h1`…`h6`). |
| `separator` | `Boolean` | `true` | Affiche un `USeparator` sous le titre. `false` pour le masquer. |
| `style` | `Object` | — | Styles CSS inline sur le titre. |

### Exemples

```json
{
  "type": "Label",
  "text": "Informations personnelles",
  "options": { "level": 2 }
}
```

```json
{
  "type": "Label",
  "text": "Sans séparateur",
  "options": {
    "level": 4,
    "separator": false,
    "style": { "letterSpacing": "0.05em" }
  }
}
```
