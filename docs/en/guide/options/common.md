# Common options

Applied to most controls (label, description, read-only, errors).

## API

| Name | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `String` | — | Field placeholder (where the Nuxt UI component supports it). |
| `focus` | `Boolean` | — | Autofocus on mount. |
| `readonly` | `Boolean` | — | Read-only field. Also enabled when the schema has `readOnly: true` or `config.readonly` is truthy. |
| `hideRequiredAsterisk` | `Boolean` | — | Hides the asterisk on required fields. |
| `showUnfocusedDescription` | `Boolean` | — | Shows the schema description even when the field is not focused. |
| `hideDescription` | `Boolean` | — | Removes the description entirely. |
| `clearOnHide` | `Boolean` | `true` | When a `HIDE` rule applies, resets the value to `default` / `undefined`. Set to `false` to keep the value. |
| `enableFilterErrorsBeforeTouch` | `Boolean` | — | Hides validation errors until the field has been touched. |
| `clearable` | `Boolean` | — | “Clear” behaviour (notably rating: click again to empty). |
| `leadingIcon` | `String` | — | Nuxt Icon shown before the control (e.g. `i-lucide-mail`). |
| `trailingIcon` | `String` | — | Nuxt Icon shown after the control (e.g. `i-lucide-check`). |
| `iconPlacement` | `'outside' \| 'inside'` | `'outside'` | `outside`: next to the widget. `inside`: within the Nuxt UI chrome (`UInput`, `USelect`, …). |
| `styles` | `Partial<Theme>` | — | Local override of the theme’s Tailwind classes (see [Customization](/en/guide/customization)). |
| `formField` | `Object` | — | Pass-through props to `UFormField` (see [Pass-through](./pass-through)). |

In `inside` mode, pass-through still wins (`options.input.leadingIcon`, …). Controls without icon chrome (checkbox, slider, number, …) ignore `inside` — use `outside` for those.

## Examples

### Always-visible description, no asterisk

```json
{
  "type": "Control",
  "scope": "#/properties/bio",
  "options": {
    "showUnfocusedDescription": true,
    "hideRequiredAsterisk": true,
    "placeholder": "A few words…"
  }
}
```

### Read-only

```json
{
  "type": "Control",
  "scope": "#/properties/id",
  "options": { "readonly": true }
}
```

### Keep the value when the control is hidden

```json
{
  "type": "Control",
  "scope": "#/properties/secret",
  "rule": {
    "effect": "HIDE",
    "condition": {
      "scope": "#/properties/reveal",
      "schema": { "const": false }
    }
  },
  "options": { "clearOnHide": false }
}
```

### Autofocus

```json
{
  "type": "Control",
  "scope": "#/properties/email",
  "options": { "focus": true, "placeholder": "you@example.com" }
}
```

### Leading / trailing icons

Next to the widget (`outside`, default):

```json
{
  "type": "Control",
  "scope": "#/properties/email",
  "options": {
    "leadingIcon": "i-lucide-mail",
    "trailingIcon": "i-lucide-check",
    "placeholder": "you@example.com"
  }
}
```

Inside the Nuxt UI field (`inside`):

```json
{
  "type": "Control",
  "scope": "#/properties/email",
  "options": {
    "leadingIcon": "i-lucide-mail",
    "trailingIcon": "i-lucide-check",
    "iconPlacement": "inside",
    "placeholder": "you@example.com"
  }
}
```

See also the **Leading / Trailing Icons** example (`prepend-append-slots`) in the [playground](/en/playground).
