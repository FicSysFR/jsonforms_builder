# Nuxt UI pass-through

Any object placed under the named key in `options` is **spread** onto the target Nuxt UI component (`size`, `color`, `variant`, `ui`, … props). This mirrors the native attributes Quasar / Vuetify forward outside their documented API.

## API — keys

| Name | Target component | Used by |
|---|---|---|
| `formField` | `UFormField` | All wrapped controls |
| `input` | `UInput` | string, password, color (text field) |
| `textarea` | `UTextarea` | `multi: true` |
| `inputNumber` | `UInputNumber` | number / integer |
| `slider` | `USlider` | `slider: true` (also when the object *is* the value of `slider`) |
| `inputRating` | `UInputRating` | `format: "rating"` |
| `checkbox` | `UCheckbox` | boolean |
| `switch` | `USwitch` | boolean + `toggle` |
| `checkboxGroup` | `UCheckboxGroup` | multi-enum |
| `radioGroup` | `URadioGroup` | `format: "radio"` |
| `select` | `USelect` | `format: "select"`, oneOf |
| `selectMenu` | `USelectMenu` | enum by default |
| `inputMenu` | `UInputMenu` | `api` |
| `pinInput` | `UPinInput` | `format: "pin"` |
| `inputTags` | `UInputTags` | `format: "tags"` |
| `colorPicker` | `UColorPicker` | color |
| `fileUpload` | `UFileUpload` | file / data-url |
| `inputDate` | `UInputDate` | date / date-time |
| `inputTime` | `UInputTime` | time |
| `calendar` | `UCalendar` | calendar / date popover |
| `calendarCard` | calendar card | dates |
| `timeCard` / `timeHour` / `timeMinute` / `timeSecond` | time parts | time |
| `editor` | `UEditor` | `wysiwyg` |
| `card` | `UCard` | Group |
| `tabs` | `UTabs` | Categorization |
| `stepper` | `UStepper` | Categorization + `variant: "stepper"` |

See the [Nuxt UI docs](https://ui.nuxt.com) for each component’s prop list.

## Examples

### Large text field + `ui` classes

```json
{
  "type": "Control",
  "scope": "#/properties/name",
  "options": {
    "input": {
      "size": "lg",
      "color": "primary",
      "ui": { "base": "tracking-wide font-medium" }
    }
  }
}
```

### Compact FormField

```json
{
  "type": "Control",
  "scope": "#/properties/code",
  "options": {
    "formField": {
      "size": "sm",
      "ui": { "label": "text-muted" }
    }
  }
}
```

### Radio in list variant

```json
{
  "type": "Control",
  "scope": "#/properties/plan",
  "options": {
    "format": "radio",
    "radioGroup": {
      "variant": "list",
      "orientation": "horizontal",
      "size": "md"
    }
  }
}
```

### Group as an outline card

```json
{
  "type": "Group",
  "label": "Profile",
  "elements": [],
  "options": {
    "card": {
      "variant": "outline",
      "ui": { "header": "font-semibold" }
    }
  }
}
```

## Playground

The showcases often pass pass-through objects (`input`, `radioGroup`, `card`, …). See the [catalogue](/en/guide/playground-examples).
