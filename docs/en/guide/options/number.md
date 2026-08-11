# Numbers

---

## Number / Integer — `UInputNumber`

**Trigger:** schema `type: "number"` or `"integer"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `step` | `Number` | `1` (integer) / `0.1` (number) | Step of the +/- buttons. |
| `placeholder` | `String` | — | Placeholder. |
| `inputNumber` | `Object` | — | Pass-through → `UInputNumber`. |

The `minimum` / `maximum` bounds come from the **schema**.

### Examples

```json
{
  "type": "integer",
  "title": "Age",
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

**Trigger:** `options.slider: true` **or** an object of Nuxt UI props (`options.slider: { size, color, … }`).  
The schema must declare `minimum` and `maximum` (no `default` needed — unlike the stock JSON Forms `isRangeControl` tester).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `slider` | `Boolean` \| `Object` | — | `true` enables the renderer. An object enables it too and is spread onto `USlider`. |
| `step` | `Number` | `schema.multipleOf` \| `1` | Slider step (takes precedence over `multipleOf`). |
| `hideValue` | `Boolean` | — | Hides the numeric badge on the right (tooltip kept). |

The schema’s `minimum` / `maximum` / `multipleOf` drive min / max / step.

### Examples

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

With Nuxt UI props + a decimal step:

```json
{
  "type": "Control",
  "scope": "#/properties/temperature",
  "options": {
    "slider": { "size": "lg", "color": "primary" },
    "step": 0.5
  }
}
```

## Playground

- [Number](/en/playground#/?section=docs&example=nuxt-number)
- [Slider](/en/playground#/?section=docs&example=nuxt-slider)
- [Rating](/en/playground#/?section=docs&example=nuxt-rating)

---

## Rating — `UInputRating`

**Trigger:** `options.format: "rating"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"rating"` | — | **Required**. |
| `length` | `Number` | `schema.maximum` | Number of icons. |
| `icon` | `String` | (Nuxt UI) | Filled icon (e.g. `i-lucide-star`). |
| `emptyIcon` | `String` | — | Empty icon. |
| `hideValue` | `Boolean` | — | Hides the numeric label next to it. |
| `clearable` | `Boolean` | `true` when not required | Click again to clear. |
| `inputRating` | `Object` | — | Pass-through → `UInputRating`. |

### Examples

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
