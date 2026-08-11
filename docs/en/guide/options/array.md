# Arrays & objects

---

## Tags — `UInputTags`

**Trigger:** schema `type: "array"` of `string` items + `options.format: "tags"`.

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"tags"` | — | **Required**. |
| `delimiter` | `String` | `","` | Separator on input (pasting a list). |
| `placeholder` | `String` | — | Placeholder. |
| `inputTags` | `Object` | — | Pass-through → `UInputTags`. |

The `uniqueItems`, `maxItems` and `items.maxLength` constraints come from the **schema**.

### Example

```json
{
  "type": "array",
  "title": "Emails",
  "uniqueItems": true,
  "maxItems": 10,
  "items": { "type": "string", "format": "email" }
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/emails",
  "options": {
    "format": "tags",
    "delimiter": ";",
    "placeholder": "name@example.com ;"
  }
}
```

---

## Array — repeatable cards

**Trigger:** schema `type: "array"` of objects (other than tags / multi-enum / file).

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `showSortButtons` | `Boolean` | — | Shows the move up / move down buttons. |
| `elementLabelProp` | `String` | — | Path (possibly deep) to the property used as each item’s title. |
| `detail` | `UISchemaElement` | — | UISchema template rendered for each element. |

### Examples

```json
{
  "type": "Control",
  "scope": "#/properties/employees",
  "options": {
    "showSortButtons": true,
    "elementLabelProp": "name"
  }
}
```

With a detailed UISchema:

```json
{
  "type": "Control",
  "scope": "#/properties/addresses",
  "options": {
    "showSortButtons": true,
    "elementLabelProp": "city",
    "detail": {
      "type": "HorizontalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/street" },
        { "type": "Control", "scope": "#/properties/city" }
      ]
    }
  }
}
```

---

## List with detail

Same set of options as Array (`showSortButtons`, `elementLabelProp`, `detail`) when the UISchema uses the JSON Forms list-with-detail layout.

---

## Object / allOf

### API

| Name | Type | Default | Description |
|---|---|---|---|
| `detail` | `UISchemaElement` | — | Custom child UISchema instead of the automatic generation. |

### Example

```json
{
  "type": "Control",
  "scope": "#/properties/address",
  "options": {
    "detail": {
      "type": "VerticalLayout",
      "elements": [
        { "type": "Control", "scope": "#/properties/line1" },
        { "type": "Control", "scope": "#/properties/zip" }
      ]
    }
  }
}
```

---

## oneOf / anyOf

Variant selector + sub-form. No dedicated domain options beyond the [common options](./common) and the `select` / `selectMenu` pass-through on the selector.

### Minimal example

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "kind": { "const": "person", "title": "Person" },
        "name": { "type": "string" }
      }
    },
    {
      "type": "object",
      "properties": {
        "kind": { "const": "company", "title": "Company" },
        "siret": { "type": "string" }
      }
    }
  ]
}
```

## Playground

- [Tags](/en/playground#/?section=docs&example=nuxt-tags)
- [Array](/en/playground#/?section=docs&example=nuxt-array)
