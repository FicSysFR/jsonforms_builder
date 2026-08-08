# Nombres

---

## Number / Integer — `UInputNumber`

**Activation :** schema `type: "number"` ou `"integer"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `step` | `Number` | `1` (integer) / `0.1` (number) | Pas des boutons +/- . |
| `placeholder` | `String` | — | Placeholder. |
| `inputNumber` | `Object` | — | Pass-through → `UInputNumber`. |

Les bornes `minimum` / `maximum` viennent du **schema**.

### Exemples

```json
{
  "type": "integer",
  "title": "Âge",
  "minimum": 0,
  "maximum": 120
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/age",
  "options": { "step": 1, "inputNumber": { "size": "md" } }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/price",
  "options": { "step": 0.01, "placeholder": "0.00" }
}
```

---

## Slider — `USlider`

**Activation :** `options.slider: true` (tester JSON Forms `isRangeControl`).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `slider` | `Boolean` \| `Object` | — | `true` active le renderer. Un objet est aussi spread sur `USlider` (pass-through). |

`minimum`, `maximum`, `multipleOf` du schema pilotent min / max / step.

### Exemple

```json
{
  "type": "number",
  "title": "Volume",
  "minimum": 0,
  "maximum": 100,
  "multipleOf": 5
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/volume",
  "options": { "slider": true }
}
```

Avec props Nuxt UI :

```json
{
  "type": "Control",
  "scope": "#/properties/volume",
  "options": {
    "slider": { "size": "lg", "color": "primary" }
  }
}
```

---

## Rating — `UInputRating`

**Activation :** `options.format: "rating"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"rating"` | — | **Requis**. |
| `length` | `Number` | `schema.maximum` | Nombre d’icônes. |
| `icon` | `String` | (Nuxt UI) | Icône remplie (ex. `i-lucide-star`). |
| `emptyIcon` | `String` | — | Icône vide. |
| `hideValue` | `Boolean` | — | Masque le libellé numérique à côté. |
| `clearable` | `Boolean` | `true` si non-required | Re-clic pour remettre à vide. |
| `inputRating` | `Object` | — | Pass-through → `UInputRating`. |

### Exemples

```json
{
  "type": "integer",
  "title": "Satisfaction",
  "minimum": 1,
  "maximum": 5
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/satisfaction",
  "options": { "format": "rating" }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/heat",
  "options": {
    "format": "rating",
    "length": 5,
    "icon": "i-lucide-flame",
    "emptyIcon": "i-lucide-flame",
    "hideValue": true,
    "clearable": true
  }
}
```
