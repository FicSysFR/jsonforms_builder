# Nuxt UI playground examples

The playground splits into two galleries:

| Tab | Content |
|---|---|
| **Documentation** | Nuxt UI showcases + API tables (Name / Type / Default / Description) |
| **Examples** | JSONForms demos, compositions and edge cases |

Any example whose `name` starts with `nuxt-` automatically lands in **Documentation**. Open the [playground](/en/playground).

## Documentation catalogue

### Overview

| Example | File | Takeaway |
|---|---|---|
| Nuxt UI — Control showcase | `nuxt-ui-showcase.ts` | Several controls side by side to judge height / alignment |
| Control Options | `control-options.ts` | Common options, restrict, toggle, autocomplete, WYSIWYG |
| Simple form | `simple-form.ts` | Minimal string + boolean form |

### Text & media controls

| Example | Components | Key options |
|---|---|---|
| [String & Textarea](/en/playground#/?section=docs&example=nuxt-string) | `UInput`, `UTextarea`, password | `restrict`, `multi`, `input`, `format: password` |
| [Pin Input](/en/playground#/?section=docs&example=nuxt-pin-input) | `UPinInput` | `format: pin`, `otp`, `mask`, `length` |
| [Color Picker](/en/playground#/?section=docs&example=nuxt-color) | `UColorPicker` | `colorFormat`, `showInput` |
| [File Upload](/en/playground#/?section=docs&example=nuxt-file-upload) | `UFileUpload` | `accept`, `layout`, multi through `array` |
| [Autocomplete API](/en/playground#/?section=docs&example=nuxt-autocomplete) | `UInputMenu` | `api.*`, `minLength`, `suggestion` |
| [WYSIWYG](/en/playground#/?section=docs&example=nuxt-wysiwyg) | `UEditor` | `wysiwyg`, `contentType` (`json` \| `html`) |

### Numbers & booleans

| Example | Components | Key options |
|---|---|---|
| [Number](/en/playground#/?section=docs&example=nuxt-number) | `UInputNumber` | `step`, `inputNumber` |
| [Slider](/en/playground#/?section=docs&example=nuxt-slider) | `USlider` | `slider`, `step`, `hideValue` |
| [Rating](/en/playground#/?section=docs&example=nuxt-rating) | `UInputRating` | `format: rating`, `icon`, `hideValue` |
| [Boolean](/en/playground#/?section=docs&example=nuxt-boolean) | `UCheckbox`, `USwitch` | `toggle`, `checkbox`, `switch` |

### Enums

| Example | Components | Key options |
|---|---|---|
| [Select](/en/playground#/?section=docs&example=nuxt-select) | `USelect`, `USelectMenu` | `format: select` vs default (search) |
| [Radio & Multi-enum](/en/playground#/?section=docs&example=nuxt-radio) | `URadioGroup`, `UCheckboxGroup` | `format: radio`, `vertical`, `radioGroup` |

### Dates

| Example | Components | Key options |
|---|---|---|
| [Date & Time](/en/playground#/?section=docs&example=nuxt-dates) | `UInputDate`, `UInputTime` | `pattern`, month / year precision |
| [Calendar](/en/playground#/?section=docs&example=nuxt-calendar) | `UCalendar` | `format: calendar` |
| [Date ranges](/en/playground#/?section=docs&example=nuxt-date-ranges) | Calendar / InputDate | `range`, `minDate`, `disabled*` |

### Structure

| Example | Components | Key options |
|---|---|---|
| [Tags](/en/playground#/?section=docs&example=nuxt-tags) | `UInputTags` | `format: tags`, `delimiter` |
| [Array](/en/playground#/?section=docs&example=nuxt-array) | Repeatable cards | `showSortButtons`, `elementLabelProp`, `detail` |
| [Layouts](/en/playground#/?section=docs&example=nuxt-layouts) | `UCard`, `UTabs`, Label | `card`, `queryKey`, `level`, `separator` |

## Adding a showcase

1. Create `playground/examples/items/nuxt-<name>.ts` calling `registerExamples([{ name: 'nuxt-…', … }])`.
2. Prefix `name` with `nuxt-` (or pass `section: 'docs'`) to land in the Documentation tab.
3. Declare the API groups in `playground/docs-api/props.ts` (`API_BY_EXAMPLE`).
4. Document the options under `docs/guide/options/` and link them from this page.

Files are eagerly loaded through `import.meta.glob` in `playground/examples/index.ts` — no extra manual registry.

## Relation to the Options API guide

Every options page ends with ready-to-paste JSON. The showcases above are their interactive counterpart:

- [Common](/en/guide/options/common)
- [Text & media](/en/guide/options/string)
- [Numbers](/en/guide/options/number)
- [Boolean](/en/guide/options/boolean)
- [Enums](/en/guide/options/enum)
- [Dates](/en/guide/options/date)
- [Arrays & objects](/en/guide/options/array)
- [Layouts](/en/guide/options/layouts)
- [Pass-through](/en/guide/options/pass-through)
