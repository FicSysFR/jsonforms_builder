/**
 * Quasar-style API props for the playground Documentation section.
 * Each doc example maps to one or more prop groups (Name / Type / Default / Description).
 */

export interface ApiProp {
  name: string
  type: string
  default?: string
  description: string
}

export interface ApiPropGroup {
  title: string
  props: ApiProp[]
}

export const COMMON_OPTIONS: ApiPropGroup = {
  title: 'Options communes',
  props: [
    {
      name: 'placeholder',
      type: 'String',
      description: 'Placeholder du champ (si le composant Nuxt UI le supporte).',
    },
    {
      name: 'focus',
      type: 'Boolean',
      description: 'Autofocus au montage.',
    },
    {
      name: 'readonly',
      type: 'Boolean',
      description: 'Lecture seule. Aussi via schema `readOnly` ou `config.readonly`.',
    },
    {
      name: 'hideRequiredAsterisk',
      type: 'Boolean',
      description: 'Masque l’astérisque des champs requis.',
    },
    {
      name: 'showUnfocusedDescription',
      type: 'Boolean',
      description: 'Affiche la description même hors focus.',
    },
    {
      name: 'hideDescription',
      type: 'Boolean',
      description: 'Supprime la description.',
    },
    {
      name: 'clearOnHide',
      type: 'Boolean',
      default: 'true',
      description:
        'Si une rule HIDE s’applique, remet la valeur à default / undefined. `false` conserve la valeur.',
    },
    {
      name: 'enableFilterErrorsBeforeTouch',
      type: 'Boolean',
      description: 'Masque les erreurs tant que le champ n’a pas été touché.',
    },
    {
      name: 'clearable',
      type: 'Boolean',
      description: 'Comportement clear (ex. rating : re-clic pour vider).',
    },
    {
      name: 'styles',
      type: 'Partial<Theme>',
      description: 'Surcharge locale des classes Tailwind du thème.',
    },
    {
      name: 'formField',
      type: 'Object',
      description: 'Pass-through → UFormField (size, ui, …).',
    },
  ],
}

const STRING: ApiPropGroup = {
  title: 'String — UInput',
  props: [
    {
      name: 'restrict',
      type: 'Boolean',
      description: 'Applique schema.maxLength et affiche un compteur.',
    },
    {
      name: 'input',
      type: 'Object',
      description: 'Pass-through → UInput (size, color, ui, …).',
    },
  ],
}

const TEXTAREA: ApiPropGroup = {
  title: 'Textarea — UTextarea',
  props: [
    {
      name: 'multi',
      type: 'Boolean',
      description: 'Requis — active le renderer textarea.',
    },
    {
      name: 'rows',
      type: 'Number',
      default: '30',
      description: 'Hauteur maximale (autoresize).',
    },
    {
      name: 'minRows',
      type: 'Number',
      description: 'Nombre de lignes initial / minimum.',
    },
    {
      name: 'textarea',
      type: 'Object',
      description: 'Pass-through → UTextarea.',
    },
  ],
}

const PIN: ApiPropGroup = {
  title: 'Pin — UPinInput',
  props: [
    {
      name: 'format',
      type: '"pin"',
      description: 'Requis — sélectionne ce renderer.',
    },
    {
      name: 'length',
      type: 'Number',
      description: 'Nombre de cellules (sinon maxLength / pattern).',
    },
    {
      name: 'type',
      type: '"text" | "number"',
      description: 'Type de clavier / saisie.',
    },
    {
      name: 'mask',
      type: 'Boolean',
      description: 'Masque les caractères saisis.',
    },
    {
      name: 'otp',
      type: 'Boolean',
      description: 'Active l’autocomplete SMS OTP.',
    },
    {
      name: 'pinInput',
      type: 'Object',
      description: 'Pass-through → UPinInput.',
    },
  ],
}

const COLOR: ApiPropGroup = {
  title: 'Color — UColorPicker',
  props: [
    {
      name: 'format',
      type: '"color"',
      description: 'Force le color picker (ou schema format: color).',
    },
    {
      name: 'colorFormat',
      type: '"hex" | "rgb" | "hsl" | "cmyk" | "lab"',
      default: '"hex"',
      description: 'Notation émise dans les données.',
    },
    {
      name: 'showInput',
      type: 'Boolean',
      default: 'true',
      description: 'Affiche le champ texte. `false` = picker seul.',
    },
    {
      name: 'colorPicker',
      type: 'Object',
      description: 'Pass-through → UColorPicker.',
    },
    {
      name: 'input',
      type: 'Object',
      description: 'Pass-through → UInput texte.',
    },
  ],
}

const FILE: ApiPropGroup = {
  title: 'File — UFileUpload',
  props: [
    {
      name: 'format',
      type: '"file"',
      description: 'Force l’upload (utile pour un array).',
    },
    {
      name: 'accept',
      type: 'String',
      description: 'Filtre MIME (sinon contentMediaType du schema).',
    },
    {
      name: 'dropLabel',
      type: 'String',
      description: 'Titre de la zone de dépôt.',
    },
    {
      name: 'dropDescription',
      type: 'String',
      description: 'Sous-texte de la zone.',
    },
    {
      name: 'layout',
      type: 'String',
      default: '"list"',
      description: 'Layout Nuxt UI (list, grid, …).',
    },
    {
      name: 'fileUpload',
      type: 'Object',
      description: 'Pass-through → UFileUpload.',
    },
  ],
}

const API_AUTOCOMPLETE: ApiPropGroup = {
  title: 'Autocomplete — options.api',
  props: [
    {
      name: 'api',
      type: 'Object',
      description: 'Requis — config fetch distant (url, base, queryKey, …).',
    },
    {
      name: 'api.url',
      type: 'String',
      description: 'Chemin ou URL de l’endpoint.',
    },
    {
      name: 'api.base',
      type: 'String',
      description: 'Préfixe d’origine.',
    },
    {
      name: 'api.queryKey',
      type: 'String',
      default: '"q"',
      description: 'Nom du paramètre de recherche.',
    },
    {
      name: 'api.itemsPath',
      type: 'String',
      description: 'Chemin (dot) vers le tableau dans la réponse.',
    },
    {
      name: 'api.labelKey',
      type: 'String',
      default: '"label"',
      description: 'Chemin vers le libellé d’un item.',
    },
    {
      name: 'api.valueKey',
      type: 'String',
      default: '"value"',
      description: 'Chemin vers la valeur stockée.',
    },
    {
      name: 'minLength',
      type: 'Number',
      description: 'Caractères minimum avant la requête.',
    },
    {
      name: 'suggestion',
      type: 'String[]',
      description: 'Suggestions locales de secours.',
    },
    {
      name: 'inputMenu',
      type: 'Object',
      description: 'Pass-through → UInputMenu.',
    },
  ],
}

const NUMBER: ApiPropGroup = {
  title: 'Number — UInputNumber',
  props: [
    {
      name: 'step',
      type: 'Number',
      default: '1 | 0.1',
      description: 'Pas des boutons +/- (défaut selon integer / number).',
    },
    {
      name: 'inputNumber',
      type: 'Object',
      description: 'Pass-through → UInputNumber.',
    },
  ],
}

const SLIDER: ApiPropGroup = {
  title: 'Slider — USlider',
  props: [
    {
      name: 'slider',
      type: 'Boolean | Object',
      description: 'true active le renderer ; un objet est spread sur USlider.',
    },
  ],
}

const RATING: ApiPropGroup = {
  title: 'Rating — UInputRating',
  props: [
    {
      name: 'format',
      type: '"rating"',
      description: 'Requis — active le rating.',
    },
    {
      name: 'length',
      type: 'Number',
      description: 'Nombre d’icônes (sinon schema.maximum).',
    },
    {
      name: 'icon',
      type: 'String',
      description: 'Icône remplie (ex. i-lucide-star).',
    },
    {
      name: 'emptyIcon',
      type: 'String',
      description: 'Icône vide.',
    },
    {
      name: 'hideValue',
      type: 'Boolean',
      description: 'Masque le libellé numérique.',
    },
    {
      name: 'clearable',
      type: 'Boolean',
      description: 'Re-clic pour vider (défaut si non-required).',
    },
    {
      name: 'inputRating',
      type: 'Object',
      description: 'Pass-through → UInputRating.',
    },
  ],
}

const BOOLEAN: ApiPropGroup = {
  title: 'Boolean — UCheckbox / USwitch',
  props: [
    {
      name: 'toggle',
      type: 'Boolean',
      description: 'true → USwitch à la place de UCheckbox.',
    },
    {
      name: 'checkbox',
      type: 'Object',
      description: 'Pass-through → UCheckbox.',
    },
    {
      name: 'switch',
      type: 'Object',
      description: 'Pass-through → USwitch (si toggle).',
    },
  ],
}

const ENUM: ApiPropGroup = {
  title: 'Enum — USelectMenu / USelect / URadioGroup',
  props: [
    {
      name: 'format',
      type: '"select" | "radio"',
      description: 'select = USelect sans recherche ; radio = URadioGroup.',
    },
    {
      name: 'suggestion',
      type: 'Array',
      description: 'Suggestions libres (SelectMenu).',
    },
    {
      name: 'vertical',
      type: 'Boolean',
      description: 'false → orientation horizontale (radio / multi-enum).',
    },
    {
      name: 'orientation',
      type: '"horizontal" | "vertical"',
      description: 'Orientation (prioritaire sur vertical).',
    },
    {
      name: 'selectMenu',
      type: 'Object',
      description: 'Pass-through → USelectMenu.',
    },
    {
      name: 'select',
      type: 'Object',
      description: 'Pass-through → USelect.',
    },
    {
      name: 'radioGroup',
      type: 'Object',
      description: 'Pass-through → URadioGroup (variant, size, color, …).',
    },
    {
      name: 'checkboxGroup',
      type: 'Object',
      description: 'Pass-through → UCheckboxGroup (multi-enum).',
    },
  ],
}

const DATE: ApiPropGroup = {
  title: 'Date / Time — UInputDate / UInputTime',
  props: [
    {
      name: 'format',
      type: '"date" | "time" | "date-time"',
      description: 'Type si absent du schema.',
    },
    {
      name: 'pattern',
      type: 'String',
      description: 'Format dayjs (YYYY-MM-DD, HH:mm, YYYY.MM, …).',
    },
    {
      name: 'locale',
      type: 'String',
      default: '"fr-FR"',
      description: 'Locale du calendrier.',
    },
    {
      name: 'months',
      type: 'Number',
      description: 'Nombre de mois affichés.',
    },
    {
      name: 'weekNumbers',
      type: 'Boolean',
      description: 'Numéros de semaine.',
    },
    {
      name: 'minDate',
      type: 'String',
      description: 'Borne min (YYYY-MM-DD | YYYY-MM | YYYY).',
    },
    {
      name: 'maxDate',
      type: 'String',
      description: 'Borne max inclusive.',
    },
    {
      name: 'disabledDates',
      type: 'String[]',
      description: 'Jours exclus (YYYY-MM-DD).',
    },
    {
      name: 'disabledWeekdays',
      type: 'Number[]',
      description: 'Jours de semaine exclus (0 = dim … 6 = sam).',
    },
    {
      name: 'disabledMonths',
      type: 'Number[]',
      description: 'Mois exclus (1–12).',
    },
    {
      name: 'disabledYears',
      type: 'Number[]',
      description: 'Années exclues.',
    },
    {
      name: 'inputDate',
      type: 'Object',
      description: 'Pass-through → UInputDate.',
    },
    {
      name: 'inputTime',
      type: 'Object',
      description: 'Pass-through → UInputTime.',
    },
    {
      name: 'calendar',
      type: 'Object',
      description: 'Pass-through → calendrier popover.',
    },
  ],
}

const CALENDAR: ApiPropGroup = {
  title: 'Calendar — UCalendar',
  props: [
    {
      name: 'format',
      type: '"calendar"',
      description: 'Requis — calendrier déplié.',
    },
    {
      name: 'range',
      type: 'Boolean',
      description: 'Sélection de plage { start, end }.',
    },
    {
      name: 'months',
      type: 'Number',
      default: '2 si range',
      description: 'Nombre de mois côte à côte.',
    },
    {
      name: 'minDate / maxDate / disabled*',
      type: 'voir Date',
      description: 'Mêmes contraintes que Date / Time.',
    },
    {
      name: 'calendar',
      type: 'Object',
      description: 'Pass-through → UCalendar.',
    },
  ],
}

const TAGS: ApiPropGroup = {
  title: 'Tags — UInputTags',
  props: [
    {
      name: 'format',
      type: '"tags"',
      description: 'Requis — active les tags.',
    },
    {
      name: 'delimiter',
      type: 'String',
      default: '","',
      description: 'Séparateur à la saisie.',
    },
    {
      name: 'inputTags',
      type: 'Object',
      description: 'Pass-through → UInputTags.',
    },
  ],
}

const WYSIWYG: ApiPropGroup = {
  title: 'WYSIWYG — UEditor',
  props: [
    {
      name: 'wysiwyg',
      type: 'Boolean',
      description: 'Requis (true) — active l’éditeur.',
    },
    {
      name: 'contentType',
      type: '"json" | "html"',
      description: 'Format stocké (objet ProseMirror ou HTML).',
    },
    {
      name: 'toolbar',
      type: 'Array',
      description: 'Remplace la barre d’outils.',
    },
    {
      name: 'editor',
      type: 'Object',
      description: 'Pass-through → UEditor.',
    },
  ],
}

const ARRAY: ApiPropGroup = {
  title: 'Array',
  props: [
    {
      name: 'showSortButtons',
      type: 'Boolean',
      description: 'Boutons monter / descendre.',
    },
    {
      name: 'elementLabelProp',
      type: 'String',
      description: 'Chemin de la prop servant de titre à chaque item.',
    },
    {
      name: 'detail',
      type: 'UISchemaElement',
      description: 'UISchema template par élément.',
    },
  ],
}

const LAYOUTS: ApiPropGroup = {
  title: 'Layouts',
  props: [
    {
      name: 'variant',
      type: '"stepper"',
      description: 'Categorization : stepper au lieu des tabs.',
    },
    {
      name: 'queryKey',
      type: 'String',
      default: '"tab"',
      description: 'Clé hash URL pour l’onglet actif.',
    },
    {
      name: 'defaultTab',
      type: 'String',
      default: '"0"',
      description: 'Onglet initial.',
    },
    {
      name: 'queryId',
      type: 'String',
      description: 'Sur Category — id stable pour le hash.',
    },
    {
      name: 'card / tabs / stepper',
      type: 'Object',
      description: 'Pass-through → UCard / UTabs / UStepper.',
    },
    {
      name: 'level',
      type: '1–6',
      default: '3',
      description: 'Label — niveau de titre h1…h6.',
    },
    {
      name: 'separator',
      type: 'Boolean',
      default: 'true',
      description: 'Label — affiche USeparator.',
    },
  ],
}

/** API groups keyed by playground example `name`. */
export const API_BY_EXAMPLE: Record<string, ApiPropGroup[]> = {
  'control-options': [
    COMMON_OPTIONS,
    STRING,
    TEXTAREA,
    NUMBER,
    SLIDER,
    BOOLEAN,
    ENUM,
    DATE,
    API_AUTOCOMPLETE,
  ],
  'nuxt-ui-showcase': [
    COMMON_OPTIONS,
    STRING,
    ENUM,
    COLOR,
    PIN,
    RATING,
    TAGS,
    CALENDAR,
    FILE,
    WYSIWYG,
  ],
  'simple-form': [COMMON_OPTIONS, STRING, BOOLEAN],
  'nuxt-string': [COMMON_OPTIONS, STRING, TEXTAREA],
  'nuxt-number': [COMMON_OPTIONS, NUMBER, SLIDER],
  'nuxt-boolean': [COMMON_OPTIONS, BOOLEAN],
  'nuxt-radio': [COMMON_OPTIONS, ENUM],
  'nuxt-select': [COMMON_OPTIONS, ENUM],
  'nuxt-autocomplete': [COMMON_OPTIONS, API_AUTOCOMPLETE],
  'nuxt-array': [COMMON_OPTIONS, ARRAY],
  'nuxt-wysiwyg': [COMMON_OPTIONS, WYSIWYG],
  'nuxt-layouts': [COMMON_OPTIONS, LAYOUTS],
  'nuxt-pin-input': [COMMON_OPTIONS, PIN],
  'nuxt-color': [COMMON_OPTIONS, COLOR],
  'nuxt-file-upload': [COMMON_OPTIONS, FILE],
  'nuxt-rating': [COMMON_OPTIONS, RATING],
  'nuxt-tags': [COMMON_OPTIONS, TAGS],
  'nuxt-dates': [COMMON_OPTIONS, DATE],
  'nuxt-calendar': [COMMON_OPTIONS, CALENDAR, DATE],
  'nuxt-date-ranges': [COMMON_OPTIONS, CALENDAR, DATE],
}

/** Fallback groups when a docs example has no dedicated mapping. */
export const DEFAULT_DOCS_API: ApiPropGroup[] = [COMMON_OPTIONS, ARRAY, LAYOUTS]

export const getApiGroupsForExample = (name: string): ApiPropGroup[] =>
  API_BY_EXAMPLE[name] ?? DEFAULT_DOCS_API
