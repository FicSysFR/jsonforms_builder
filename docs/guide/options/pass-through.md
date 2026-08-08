# Pass-through Nuxt UI

Tout objet placé sous la clé nommée dans `options` est **spread** sur le composant Nuxt UI cible (props `size`, `color`, `variant`, `ui`, …). Mécanisme équivalent aux attributs natifs transmis par Quasar / Vuetify hors de leur API documentée.

## API — clés

| Name | Composant cible | Utilisé par |
|---|---|---|
| `formField` | `UFormField` | Tous les contrôles wrappés |
| `input` | `UInput` | string, password, color (champ texte) |
| `textarea` | `UTextarea` | `multi: true` |
| `inputNumber` | `UInputNumber` | number / integer |
| `slider` | `USlider` | `slider: true` (aussi si l’objet est la valeur de `slider`) |
| `inputRating` | `UInputRating` | `format: "rating"` |
| `checkbox` | `UCheckbox` | boolean |
| `switch` | `USwitch` | boolean + `toggle` |
| `checkboxGroup` | `UCheckboxGroup` | multi-enum |
| `radioGroup` | `URadioGroup` | `format: "radio"` |
| `select` | `USelect` | `format: "select"`, oneOf |
| `selectMenu` | `USelectMenu` | enum par défaut |
| `inputMenu` | `UInputMenu` | `api` |
| `pinInput` | `UPinInput` | `format: "pin"` |
| `inputTags` | `UInputTags` | `format: "tags"` |
| `colorPicker` | `UColorPicker` | color |
| `fileUpload` | `UFileUpload` | file / data-url |
| `inputDate` | `UInputDate` | date / date-time |
| `inputTime` | `UInputTime` | time |
| `calendar` | `UCalendar` | calendar / popover date |
| `calendarCard` | carte calendrier | dates |
| `timeCard` / `timeHour` / `timeMinute` / `timeSecond` | parties heure | time |
| `editor` | `UEditor` | `wysiwyg` |
| `card` | `UCard` | Group |
| `tabs` | `UTabs` | Categorization |
| `stepper` | `UStepper` | Categorization + `variant: "stepper"` |

Consultez la [doc Nuxt UI](https://ui.nuxt.com) pour la liste des props de chaque composant.

## Exemples

### Champ texte large + classes `ui`

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

### FormField compact

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

### Radio en variante liste

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

### Group en carte outline

```json
{
  "type": "Group",
  "label": "Profil",
  "elements": [],
  "options": {
    "card": {
      "variant": "outline",
      "ui": { "header": "font-semibold" }
    }
  }
}
```
