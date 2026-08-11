# Boolean

**Trigger:** schema `type: "boolean"`.  
Default component: `UCheckbox`. With `toggle`: `USwitch`.

## API

| Name | Type | Default | Description |
|---|---|---|---|
| `toggle` | `Boolean` | — | When `true`, renders a `USwitch` instead of the `UCheckbox`. |
| `checkbox` | `Object` | — | Pass-through → `UCheckbox` (ignored when `toggle` is set). |
| `switch` | `Object` | — | Pass-through → `USwitch` (when `toggle` is set). |

## Examples

### Checkbox

```json
{
  "type": "boolean",
  "title": "I accept the terms"
}
```

```json
{
  "type": "Control",
  "scope": "#/properties/terms",
  "options": {
    "checkbox": { "color": "primary" }
  }
}
```

### Switch

```json
{
  "type": "Control",
  "scope": "#/properties/notifications",
  "options": {
    "toggle": true,
    "switch": { "size": "lg", "color": "success" }
  }
}
```

## Playground

→ [Boolean](/en/playground#/?section=docs&example=nuxt-boolean)
