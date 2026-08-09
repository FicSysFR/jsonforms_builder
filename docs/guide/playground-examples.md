# Exemples playground Nuxt UI

Le playground sépare deux galeries :

| Onglet | Contenu |
|---|---|
| **Documentation** | Vitrines Nuxt UI + tableaux API (Name / Type / Default / Description) |
| **Examples** | Démos JSONForms, compositions et cas limites |

Tout exemple dont le `name` commence par `nuxt-` atterrit automatiquement dans **Documentation**. Ouvrir le [playground](/playground) ou la [version plein écran](/play/index.html).

## Catalogue Documentation

### Vue d’ensemble

| Exemple | Fichier | À retenir |
|---|---|---|
| Nuxt UI — Vitrine des contrôles | `nuxt-ui-showcase.ts` | Plusieurs contrôles côte à côte pour juger hauteur / alignement |
| Control Options | `control-options.ts` | Options communes, restrict, toggle, autocomplete, WYSIWYG |
| Simple form | `simple-form.ts` | Formulaire minimal string + boolean |

### Contrôles texte & médias

| Exemple | Composants | Options clés |
|---|---|---|
| [String & Textarea](/play/index.html?section=docs&example=nuxt-string) | `UInput`, `UTextarea`, password | `restrict`, `multi`, `input`, `format: password` |
| [Pin Input](/play/index.html?section=docs&example=nuxt-pin-input) | `UPinInput` | `format: pin`, `otp`, `mask`, `length` |
| [Color Picker](/play/index.html?section=docs&example=nuxt-color) | `UColorPicker` | `colorFormat`, `showInput` |
| [File Upload](/play/index.html?section=docs&example=nuxt-file-upload) | `UFileUpload` | `accept`, `layout`, multi via `array` |
| [Autocomplete API](/play/index.html?section=docs&example=nuxt-autocomplete) | `UInputMenu` | `api.*`, `minLength`, `suggestion` |
| [WYSIWYG](/play/index.html?section=docs&example=nuxt-wysiwyg) | `UEditor` | `wysiwyg`, `contentType` (`json` \| `html`) |

### Nombres & booléens

| Exemple | Composants | Options clés |
|---|---|---|
| [Number](/play/index.html?section=docs&example=nuxt-number) | `UInputNumber` | `step`, `inputNumber` |
| [Slider](/play/index.html?section=docs&example=nuxt-slider) | `USlider` | `slider`, `step`, `hideValue` |
| [Rating](/play/index.html?section=docs&example=nuxt-rating) | `UInputRating` | `format: rating`, `icon`, `hideValue` |
| [Boolean](/play/index.html?section=docs&example=nuxt-boolean) | `UCheckbox`, `USwitch` | `toggle`, `checkbox`, `switch` |

### Enumérations

| Exemple | Composants | Options clés |
|---|---|---|
| [Select](/play/index.html?section=docs&example=nuxt-select) | `USelect`, `USelectMenu` | `format: select` vs défaut (recherche) |
| [Radio & Multi-enum](/play/index.html?section=docs&example=nuxt-radio) | `URadioGroup`, `UCheckboxGroup` | `format: radio`, `vertical`, `radioGroup` |

### Dates

| Exemple | Composants | Options clés |
|---|---|---|
| [Date & Time](/play/index.html?section=docs&example=nuxt-dates) | `UInputDate`, `UInputTime` | `pattern`, précision mois / année |
| [Calendar](/play/index.html?section=docs&example=nuxt-calendar) | `UCalendar` | `format: calendar` |
| [Date ranges](/play/index.html?section=docs&example=nuxt-date-ranges) | Calendar / InputDate | `range`, `minDate`, `disabled*` |

### Structure

| Exemple | Composants | Options clés |
|---|---|---|
| [Tags](/play/index.html?section=docs&example=nuxt-tags) | `UInputTags` | `format: tags`, `delimiter` |
| [Array](/play/index.html?section=docs&example=nuxt-array) | Cartes répétables | `showSortButtons`, `elementLabelProp`, `detail` |
| [Layouts](/play/index.html?section=docs&example=nuxt-layouts) | `UCard`, `UTabs`, Label | `card`, `queryKey`, `level`, `separator` |

## Ajouter une vitrine

1. Créer `playground/examples/items/nuxt-<nom>.ts` qui appelle `registerExamples([{ name: 'nuxt-…', … }])`.
2. Préfixer `name` par `nuxt-` (ou passer `section: 'docs'`) pour l’onglet Documentation.
3. Déclarer les groupes API dans `playground/docs-api/props.ts` (`API_BY_EXAMPLE`).
4. Documenter les options dans `docs/guide/options/` et lier depuis cette page.

Les fichiers sont chargés en eager via `import.meta.glob` dans `playground/examples/index.ts` — aucun registre manuel supplémentaire.

## Lien avec le guide Options API

Chaque page d’options se termine par des JSON prêts à coller. Les vitrines ci-dessus en sont la version interactive :

- [Communes](/guide/options/common)
- [Texte & médias](/guide/options/string)
- [Nombres](/guide/options/number)
- [Booléen](/guide/options/boolean)
- [Enumérations](/guide/options/enum)
- [Dates](/guide/options/date)
- [Tableaux & objets](/guide/options/array)
- [Layouts](/guide/options/layouts)
- [Pass-through](/guide/options/pass-through)
