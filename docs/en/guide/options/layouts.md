# Layouts

---

## Group — `UCard`

**Trigger:** UISchema element `type: "Group"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `card` | `Object` | — | Pass-through → `UCard` (`variant`, `ui`, …). |

The Group’s `label` becomes the card title.

### Example

```json
{
  "type": "Group",
  "label": "Contact details",
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

**Trigger:** `type: "Categorization"` with `Category` children.

### API (on Categorization)

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `"stepper"` | tabs | `"stepper"` → `UStepper` wizard; otherwise `UTabs`. |
| `queryKey` | `String` | `"tab"` | Hash / query key used to remember the active tab. |
| `defaultTab` | `String` | `"0"` | Initial tab identifier. |
| `tabs` | `Object` | — | Pass-through → `UTabs`. |
| `stepper` | `Object` | — | Pass-through → `UStepper`. |

### API (on Category)

| Name | Type | Default | Description |
|---|---|---|---|
| `queryId` | `String` | index | Stable identifier for the URL hash. |

### Examples

Tabs:

```json
{
  "type": "Categorization",
  "options": { "queryKey": "section", "defaultTab": "basic" },
  "elements": [
    {
      "type": "Category",
      "label": "Basics",
      "options": { "queryId": "basic" },
      "elements": [
        { "type": "Control", "scope": "#/properties/name" }
      ]
    },
    {
      "type": "Category",
      "label": "Advanced",
      "options": { "queryId": "advanced" },
      "elements": [
        { "type": "Control", "scope": "#/properties/notes" }
      ]
    }
  ]
}
```

Stepper:

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
      "label": "Step 1",
      "elements": [{ "type": "Control", "scope": "#/properties/a" }]
    },
    {
      "type": "Category",
      "label": "Step 2",
      "elements": [{ "type": "Control", "scope": "#/properties/b" }]
    }
  ]
}
```

---

## VerticalLayout / HorizontalLayout

No dedicated domain options. The Tailwind theme is overridden through `options.styles` or `provide('styles', …)` (`verticalLayout` / `horizontalLayout`).

### Example

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

**Trigger:** `type: "Label"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `level` | `1`–`6` | `3` | HTML heading level (`h1`…`h6`). |
| `separator` | `Boolean` | `true` | Shows a `USeparator` under the heading. `false` hides it. |
| `style` | `Object` | — | Inline CSS styles on the heading. |

### Examples

```json
{
  "type": "Label",
  "text": "Personal information",
  "options": { "level": 2 }
}
```

```json
{
  "type": "Label",
  "text": "No separator",
  "options": {
    "level": 4,
    "separator": false,
    "style": { "letterSpacing": "0.05em" }
  }
}
```

## Playground

→ [Layouts](/en/playground#/?section=docs&example=nuxt-layouts)
