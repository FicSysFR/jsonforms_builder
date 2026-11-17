import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import { createUiText, type UiMessageKey, type UiText } from '../i18n/ui'

/** Palette groups: stable French identifiers, displayed through {@link paletteGroupLabel}. */
export type PaletteGroup = 'Saisie' | 'Choix' | 'Date & heure' | 'Structure'

const PALETTE_GROUP_KEYS: Record<PaletteGroup, UiMessageKey> = {
  Saisie: 'jsonformsBuilder.builder.palette.group.input',
  Choix: 'jsonformsBuilder.builder.palette.group.choice',
  'Date & heure': 'jsonformsBuilder.builder.palette.group.dateTime',
  Structure: 'jsonformsBuilder.builder.palette.group.structure',
}

/** Displayed name of a palette group. */
export const paletteGroupLabel = (group: PaletteGroup, t: UiText = createUiText()): string =>
  t(PALETTE_GROUP_KEYS[group])

/**
 * A field type offered in the palette.
 *
 * Each entry knows how to produce *both halves* of a field: the JSON Schema fragment
 * (the data contract) and the uischema options (the rendering). That is all the
 * builder needs to create a field — adding a type is done here, without touching components.
 */
export interface PaletteField {
  /** Stable key, used in the drag-and-drop clipboard. */
  key: string
  label: string
  icon: string
  /** Grouping displayed in the palette. */
  group: PaletteGroup
  /** Schema fragment describing the property. */
  schema: () => JsonSchema
  /** Uischema options to set on the `Control` (optional). */
  options?: () => Record<string, unknown>
  /**
   * Optional custom uischema element (e.g. `ListWithDetail`). When omitted, a standard
   * `Control` is created via {@link createControl}.
   */
  createElement?: (property: string) => UISchemaElement
}

/**
 * Containers: uischema elements that hold other elements and have
 * no counterpart in the JSON Schema.
 */
export interface PaletteContainer {
  key: string
  label: string
  icon: string
  create: () => UISchemaElement
}

/** Palette fields, labelled through `t` (French by default). */
export const createPaletteFields = (t: UiText = createUiText()): PaletteField[] => [
  {
    key: 'text',
    label: t('jsonformsBuilder.builder.palette.field.text'),
    icon: 'i-lucide-type',
    group: 'Saisie',
    schema: () => ({ type: 'string' }),
  },
  {
    key: 'textarea',
    label: t('jsonformsBuilder.builder.palette.field.textarea'),
    icon: 'i-lucide-text',
    group: 'Saisie',
    schema: () => ({ type: 'string' }),
    options: () => ({ multi: true }),
  },
  {
    key: 'wysiwyg',
    label: t('jsonformsBuilder.builder.palette.field.wysiwyg'),
    icon: 'i-lucide-pilcrow',
    group: 'Saisie',
    schema: () => ({ type: 'object' }),
    options: () => ({ wysiwyg: true, contentType: 'json' }),
  },
  {
    key: 'password',
    label: t('jsonformsBuilder.builder.palette.field.password'),
    icon: 'i-lucide-key-round',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'password' }),
  },
  {
    key: 'number',
    label: t('jsonformsBuilder.builder.palette.field.number'),
    icon: 'i-lucide-hash',
    group: 'Saisie',
    schema: () => ({ type: 'number' }),
  },
  {
    key: 'integer',
    label: t('jsonformsBuilder.builder.palette.field.integer'),
    icon: 'i-lucide-sigma',
    group: 'Saisie',
    schema: () => ({ type: 'integer' }),
  },
  {
    key: 'slider',
    label: t('jsonformsBuilder.builder.palette.field.slider'),
    icon: 'i-lucide-sliders-horizontal',
    group: 'Saisie',
    schema: () => ({ type: 'integer', minimum: 0, maximum: 100, default: 50 }),
    options: () => ({ slider: true }),
  },
  {
    key: 'pin',
    label: t('jsonformsBuilder.builder.palette.field.pin'),
    icon: 'i-lucide-rectangle-ellipsis',
    group: 'Saisie',
    schema: () => ({ type: 'string', pattern: '^\\d{6}$' }),
    options: () => ({ format: 'pin' }),
  },
  {
    key: 'color',
    label: t('jsonformsBuilder.builder.palette.field.color'),
    icon: 'i-lucide-palette',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'color' }),
  },
  {
    key: 'file',
    label: t('jsonformsBuilder.builder.palette.field.file'),
    icon: 'i-lucide-paperclip',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'data-url' }),
  },
  {
    key: 'rating',
    label: t('jsonformsBuilder.builder.palette.field.rating'),
    icon: 'i-lucide-star',
    group: 'Choix',
    schema: () => ({ type: 'integer', minimum: 1, maximum: 5 }),
    options: () => ({ format: 'rating' }),
  },
  {
    key: 'boolean',
    label: t('jsonformsBuilder.builder.palette.field.boolean'),
    icon: 'i-lucide-square-check',
    group: 'Choix',
    schema: () => ({ type: 'boolean' }),
  },
  {
    key: 'enum',
    label: t('jsonformsBuilder.builder.palette.field.enum'),
    icon: 'i-lucide-list',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
  },
  {
    key: 'radio',
    label: t('jsonformsBuilder.builder.palette.field.radio'),
    icon: 'i-lucide-circle-dot',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
    options: () => ({ format: 'radio' }),
  },
  {
    key: 'select',
    label: t('jsonformsBuilder.builder.palette.field.select'),
    icon: 'i-lucide-chevrons-up-down',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
    options: () => ({ format: 'select' }),
  },
  {
    key: 'tags',
    label: t('jsonformsBuilder.builder.palette.field.tags'),
    icon: 'i-lucide-tags',
    group: 'Choix',
    schema: () => ({ type: 'array', uniqueItems: true, items: { type: 'string' } }),
    options: () => ({ format: 'tags' }),
  },
  {
    key: 'multi-enum',
    label: t('jsonformsBuilder.builder.palette.field.multiEnum'),
    icon: 'i-lucide-list-checks',
    group: 'Choix',
    schema: () => ({
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', enum: ['Option A', 'Option B', 'Option C'] },
    }),
  },
  {
    key: 'date',
    label: t('jsonformsBuilder.builder.palette.field.date'),
    icon: 'i-lucide-calendar',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date' }),
  },
  {
    key: 'datetime',
    label: t('jsonformsBuilder.builder.palette.field.datetime'),
    icon: 'i-lucide-calendar-clock',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date-time' }),
  },
  {
    key: 'time',
    label: t('jsonformsBuilder.builder.palette.field.time'),
    icon: 'i-lucide-clock',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'time' }),
  },
  {
    key: 'calendar',
    label: t('jsonformsBuilder.builder.palette.field.calendar'),
    icon: 'i-lucide-calendar-days',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date' }),
    options: () => ({ format: 'calendar' }),
  },
  {
    key: 'date-range',
    label: t('jsonformsBuilder.builder.palette.field.dateRange'),
    icon: 'i-lucide-calendar-range',
    group: 'Date & heure',
    schema: () => ({
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date',
          title: t('jsonformsBuilder.builder.palette.default.rangeStart'),
        },
        end: {
          type: 'string',
          format: 'date',
          title: t('jsonformsBuilder.builder.palette.default.rangeEnd'),
        },
      },
    }),
    options: () => ({ format: 'calendar', range: true }),
  },
  {
    key: 'array',
    label: t('jsonformsBuilder.builder.palette.field.array'),
    icon: 'i-lucide-rows-3',
    group: 'Structure',
    schema: () => ({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', title: t('jsonformsBuilder.builder.palette.default.itemLabel') },
        },
      },
    }),
    options: () => ({ showSortButtons: true, elementLabelProp: 'label' }),
  },
  {
    key: 'list-with-detail',
    label: t('jsonformsBuilder.builder.palette.field.listWithDetail'),
    icon: 'i-lucide-panel-left',
    group: 'Structure',
    schema: () => ({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', title: t('jsonformsBuilder.builder.palette.default.itemLabel') },
          notes: { type: 'string', title: t('jsonformsBuilder.builder.palette.default.itemNotes') },
        },
      },
    }),
    createElement: (property) =>
      ({
        type: 'ListWithDetail',
        scope: `#/properties/${property}`,
        options: { showSortButtons: true, elementLabelProp: 'label' },
      }) as UISchemaElement,
  },
  {
    key: 'object',
    label: t('jsonformsBuilder.builder.palette.field.object'),
    icon: 'i-lucide-braces',
    group: 'Structure',
    schema: () => ({
      type: 'object',
      properties: {
        champ: { type: 'string', title: t('jsonformsBuilder.builder.palette.default.objectField') },
      },
    }),
  },
]

export const PALETTE_FIELDS: PaletteField[] = createPaletteFields()

/** Palette containers, labelled through `t` (French by default). */
export const createPaletteContainers = (t: UiText = createUiText()): PaletteContainer[] => [
  {
    key: 'VerticalLayout',
    label: t('jsonformsBuilder.builder.palette.container.verticalLayout'),
    icon: 'i-lucide-rows-2',
    create: () => ({ type: 'VerticalLayout', elements: [] }) as UISchemaElement,
  },
  {
    key: 'HorizontalLayout',
    label: t('jsonformsBuilder.builder.palette.container.horizontalLayout'),
    icon: 'i-lucide-columns-2',
    create: () => ({ type: 'HorizontalLayout', elements: [] }) as UISchemaElement,
  },
  {
    key: 'Group',
    label: t('jsonformsBuilder.builder.palette.container.group'),
    icon: 'i-lucide-square-dashed',
    create: () =>
      ({
        type: 'Group',
        label: t('jsonformsBuilder.builder.palette.default.group'),
        elements: [],
      }) as UISchemaElement,
  },
  {
    key: 'Categorization',
    label: t('jsonformsBuilder.builder.palette.container.categorization'),
    icon: 'i-lucide-panels-top-left',
    create: () =>
      ({
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: t('jsonformsBuilder.builder.palette.default.category', { index: 1 }),
            elements: [],
          },
          {
            type: 'Category',
            label: t('jsonformsBuilder.builder.palette.default.category', { index: 2 }),
            elements: [],
          },
        ],
      }) as UISchemaElement,
  },
  {
    key: 'Label',
    label: t('jsonformsBuilder.builder.palette.container.label'),
    icon: 'i-lucide-heading',
    create: () =>
      ({
        type: 'Label',
        text: t('jsonformsBuilder.builder.palette.default.label'),
      }) as UISchemaElement,
  },
]

export const PALETTE_CONTAINERS: PaletteContainer[] = createPaletteContainers()

/** Finds a palette field; with `t`, its label and default titles follow that resolver. */
export const findPaletteField = (key: string, t?: UiText): PaletteField | undefined =>
  (t ? createPaletteFields(t) : PALETTE_FIELDS).find((field) => field.key === key)

/** Finds a palette container; with `t`, its label and default texts follow that resolver. */
export const findPaletteContainer = (key: string, t?: UiText): PaletteContainer | undefined =>
  (t ? createPaletteContainers(t) : PALETTE_CONTAINERS).find((container) => container.key === key)

/** A minimal `Control` pointing at a root property. */
export const createControl = (
  property: string,
  options?: Record<string, unknown>,
): ControlElement => {
  const control: ControlElement = {
    type: 'Control',
    scope: `#/properties/${property}`,
  }

  if (options && Object.keys(options).length) {
    control.options = options
  }

  return control
}
