# Enums

---

## Select menu (default) — `USelectMenu`

**Trigger:** schema `enum` or `oneOf` const/title, with no special `format`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `suggestion` | `Array` | — | Free-form suggestions (also usable outside a strict enum). |
| `placeholder` | `String` | — | Placeholder. |
| `selectMenu` | `Object` | — | Pass-through → `USelectMenu` (search, size, …). |

### Example

```json
{
  "type": "string",
  "title": "Country",
  "enum": ["FR", "BE", "CH"]
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/country",
  "options": {
    "placeholder": "Choose…",
    "selectMenu": { "size": "md" }
  }
}
```

---

## Select (no search) — `USelect`

**Trigger:** `options.format: "select"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"select"` | — | **Required**. |
| `select` | `Object` | — | Pass-through → `USelect`. |

### Example

```json
{
  "type": "Control",
  "scope": "#/properties/tier",
  "options": {
    "format": "select",
    "placeholder": "Plan",
    "select": { "size": "sm" }
  }
}
```

---

## Radio — `URadioGroup`

**Trigger:** `options.format: "radio"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"radio"` | — | **Required**. |
| `vertical` | `Boolean` | `true` (effective) | `false` → horizontal orientation. |
| `orientation` | `"horizontal"` \| `"vertical"` | — | Takes precedence over `vertical` when set. |
| `radioGroup` | `Object` | — | Pass-through → `URadioGroup` (`variant`, `size`, `color`, `orientation`, …). |

**Orientation precedence:** `radioGroup.orientation` > `orientation` > `vertical: false` > vertical.

### Examples

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

**Trigger:** schema `type: "array"` with `items.enum` or `items.oneOf`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `vertical` | `Boolean` | — | `false` → horizontal layout. |
| `checkboxGroup` | `Object` | — | Pass-through → `UCheckboxGroup`. |

### Example

```json
{
  "type": "array",
  "title": "Skills",
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

- [Select](/en/playground#/?section=docs&example=nuxt-select)
- [Radio & Multi-enum](/en/playground#/?section=docs&example=nuxt-radio)
