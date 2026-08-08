# Booléen

**Activation :** schema `type: "boolean"`.  
Composant par défaut : `UCheckbox`. Avec `toggle` : `USwitch`.

## API

| Name | Type | Default | Description |
|---|---|---|---|
| `toggle` | `Boolean` | — | Si `true`, rend un `USwitch` à la place du `UCheckbox`. |
| `checkbox` | `Object` | — | Pass-through → `UCheckbox` (ignoré si `toggle`). |
| `switch` | `Object` | — | Pass-through → `USwitch` (si `toggle`). |

## Exemples

### Case à cocher

```json
{
  "type": "boolean",
  "title": "J’accepte les conditions"
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

### Interrupteur

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
