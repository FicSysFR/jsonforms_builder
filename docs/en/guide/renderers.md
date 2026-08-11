# Renderers

Schema / option → Nuxt UI component mapping.

| Schema / option | Nuxt UI component | Detailed options |
|---|---|---|
| `string` | `UInput` | [Text](./options/string#string-—-uinput) |
| `string` + `options.multi` | `UTextarea` | [Textarea](./options/string#textarea-—-utextarea) |
| `string` + `format: password` | `UInput` + toggle | [Password](./options/string#password) |
| `object` + `options.wysiwyg` | `UEditor` | [WYSIWYG](./options/string#wysiwyg-—-ueditor) |
| `string` + `options.format: pin` | `UPinInput` | [Pin](./options/string#pin-—-upininput) |
| `string` + `format: color` | `UColorPicker` | [Color](./options/string#color-—-ucolorpicker) |
| `string` + `format: data-url` | `UFileUpload` | [File](./options/string#file-upload-—-ufileupload) |
| `number` / `integer` | `UInputNumber` | [Numbers](./options/number) |
| `number` + `options.slider` | `USlider` | [Slider](./options/number#slider-—-uslider) |
| `number` + `options.format: rating` | `UInputRating` | [Rating](./options/number#rating-—-uinputrating) |
| `boolean` | `UCheckbox` / `USwitch` | [Boolean](./options/boolean) |
| `enum` | `USelectMenu` | [Enum](./options/enum) |
| `enum` + `options.format: select` | `USelect` | [Select](./options/enum#select-no-search-—-uselect) |
| `enum` + `options.format: radio` | `URadioGroup` | [Radio](./options/enum#radio-—-uradiogroup) |
| `string` + `options.api` | `UInputMenu` | [Autocomplete](./options/string#autocomplete-api-—-uinputmenu) |
| `format: date` / `date-time` / `time` | `UInputDate` / `UInputTime` | [Dates](./options/date) |
| `options.format: calendar` | `UCalendar` | [Calendar](./options/date#calendar-—-inline-ucalendar) |
| `array` + `options.format: tags` | `UInputTags` | [Tags](./options/array#tags-—-uinputtags) |
| `array` | repeatable cards | [Array](./options/array#array-—-repeatable-cards) |
| `oneOf` | selector + sub-form | [oneOf](./options/array#oneof-anyof) |
| `Group` | `UCard` | [Group](./options/layouts#group-—-ucard) |
| `Categorization` | `UTabs` / `UStepper` | [Categorization](./options/layouts#categorization-—-utabs-ustepper) |
| `Label` | heading + `USeparator` | [Label](./options/layouts#label) |

→ [Full options API index](./options/) (Name / Type / Default / Description tables + examples, Quasar / Vuetify style).

→ [Playground showcase catalogue](./playground-examples) (live forms + API tab).
