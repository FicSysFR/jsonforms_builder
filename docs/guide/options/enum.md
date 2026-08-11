# Enumérations

---

## Select menu (défaut) — `USelectMenu`

**Activation :** schema `enum` ou `oneOf` const/title, sans `format` spécial.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `suggestion` | `Array` | — | Suggestions libres (également utilisable hors enum strict). |
| `placeholder` | `String` | — | Placeholder. |
| `selectMenu` | `Object` | — | Pass-through → `USelectMenu` (recherche, taille, …). |

### Exemple

```json
{
  "type": "string",
  "title": "Pays",
  "enum": ["FR", "BE", "CH"]
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/country",
  "options": {
    "placeholder": "Choisir…",
    "selectMenu": { "size": "md" }
  }
}
```

---

## Select (sans recherche) — `USelect`

**Activation :** `options.format: "select"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"select"` | — | **Requis**. |
| `select` | `Object` | — | Pass-through → `USelect`. |

### Exemple

```json
{
  "type": "Control",
  "scope": "#/properties/tier",
  "options": {
    "format": "select",
    "placeholder": "Formule",
    "select": { "size": "sm" }
  }
}
```

---

## Radio — `URadioGroup`

**Activation :** `options.format: "radio"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"radio"` | — | **Requis**. |
| `vertical` | `Boolean` | `true` (effectif) | `false` → orientation horizontale. |
| `orientation` | `"horizontal"` \| `"vertical"` | — | Prioritaire sur `vertical` si défini. |
| `radioGroup` | `Object` | — | Pass-through → `URadioGroup` (`variant`, `size`, `color`, `orientation`, …). |

**Priorité d’orientation :** `radioGroup.orientation` > `orientation` > `vertical: false` > vertical.

### Exemples

```json
{
  "type": "Control",
  "scope": "#/properties/size",
  "options": {
    "format": "radio",
    "vertical": false
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/plan",
  "options": {
    "format": "radio",
    "orientation": "horizontal",
    "radioGroup": {
      "variant": "list",
      "size": "md",
      "color": "primary"
    }
  }
}
```

---

## Multi-enum — `UCheckboxGroup`

**Activation :** schema `type: "array"` avec `items.enum` ou `items.oneOf`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `vertical` | `Boolean` | — | `false` → disposition horizontale. |
| `checkboxGroup` | `Object` | — | Pass-through → `UCheckboxGroup`. |

### Exemple

```json
{
  "type": "array",
  "title": "Compétences",
  "uniqueItems": true,
  "items": {
    "type": "string",
    "enum": ["vue", "typescript", "css"]
  }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/skills",
  "options": {
    "vertical": false,
    "checkboxGroup": { "size": "sm" }
  }
}
```

## Playground

- [Select](/playground#/?section=docs&example=nuxt-select)
- [Radio & Multi-enum](/playground#/?section=docs&example=nuxt-radio)