# Renderers

Correspondance schéma / options → composant Nuxt UI.

| Schéma / option | Composant Nuxt UI | Options détaillées |
|---|---|---|
| `string` | `UInput` | [Texte](./options/string#string--uinput) |
| `string` + `options.multi` | `UTextarea` | [Textarea](./options/string#textarea--utextarea) |
| `string` + `format: password` | `UInput` + bascule | [Password](./options/string#password) |
| `object` + `options.wysiwyg` | `UEditor` | [WYSIWYG](./options/string#wysiwyg--ueditor) |
| `string` + `options.format: pin` | `UPinInput` | [Pin](./options/string#pin--upininput) |
| `string` + `format: color` | `UColorPicker` | [Color](./options/string#color--ucolorpicker) |
| `string` + `format: data-url` | `UFileUpload` | [File](./options/string#file-upload--ufileupload) |
| `number` / `integer` | `UInputNumber` | [Nombres](./options/number) |
| `number` + `options.slider` | `USlider` | [Slider](./options/number#slider--uslider) |
| `number` + `options.format: rating` | `UInputRating` | [Rating](./options/number#rating--uinputrating) |
| `boolean` | `UCheckbox` / `USwitch` | [Booléen](./options/boolean) |
| `enum` | `USelectMenu` | [Enum](./options/enum) |
| `enum` + `options.format: select` | `USelect` | [Select](./options/enum#select-sans-recherche--uselect) |
| `enum` + `options.format: radio` | `URadioGroup` | [Radio](./options/enum#radio--uradiogroup) |
| `string` + `options.api` | `UInputMenu` | [Autocomplete](./options/string#autocomplete-api--uinputmenu) |
| `format: date` / `date-time` / `time` | `UInputDate` / `UInputTime` | [Dates](./options/date) |
| `options.format: calendar` | `UCalendar` | [Calendar](./options/date#calendar--ucalendar-déplié) |
| `array` + `options.format: tags` | `UInputTags` | [Tags](./options/array#tags--uinputtags) |
| `array` | cartes répétables | [Array](./options/array#array--cartes-répétables) |
| `oneOf` | sélecteur + sous-formulaire | [oneOf](./options/array#oneof--anyof) |
| `Group` | `UCard` | [Group](./options/layouts#group--ucard) |
| `Categorization` | `UTabs` / `UStepper` | [Categorization](./options/layouts#categorization--utabs--ustepper) |
| `Label` | titre + `USeparator` | [Label](./options/layouts#label) |

→ [Index complet de l’API options](./options/) (tableaux Name / Type / Default / Description + exemples, style Quasar / Vuetify).
