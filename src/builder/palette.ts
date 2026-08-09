import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'

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
  group: 'Saisie' | 'Choix' | 'Date & heure' | 'Structure'
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

export const PALETTE_FIELDS: PaletteField[] = [
  {
    key: 'text',
    label: 'Texte',
    icon: 'i-lucide-type',
    group: 'Saisie',
    schema: () => ({ type: 'string' }),
  },
  {
    key: 'textarea',
    label: 'Texte long',
    icon: 'i-lucide-text',
    group: 'Saisie',
    schema: () => ({ type: 'string' }),
    options: () => ({ multi: true }),
  },
  {
    key: 'wysiwyg',
    label: 'Texte riche',
    icon: 'i-lucide-pilcrow',
    group: 'Saisie',
    schema: () => ({ type: 'object' }),
    options: () => ({ wysiwyg: true, contentType: 'json' }),
  },
  {
    key: 'password',
    label: 'Mot de passe',
    icon: 'i-lucide-key-round',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'password' }),
  },
  {
    key: 'number',
    label: 'Nombre',
    icon: 'i-lucide-hash',
    group: 'Saisie',
    schema: () => ({ type: 'number' }),
  },
  {
    key: 'integer',
    label: 'Entier',
    icon: 'i-lucide-sigma',
    group: 'Saisie',
    schema: () => ({ type: 'integer' }),
  },
  {
    key: 'slider',
    label: 'Curseur',
    icon: 'i-lucide-sliders-horizontal',
    group: 'Saisie',
    schema: () => ({ type: 'integer', minimum: 0, maximum: 100 }),
    options: () => ({ slider: true }),
  },
  {
    key: 'pin',
    label: 'Code / PIN',
    icon: 'i-lucide-rectangle-ellipsis',
    group: 'Saisie',
    schema: () => ({ type: 'string', pattern: '^\\d{6}$' }),
    options: () => ({ format: 'pin' }),
  },
  {
    key: 'color',
    label: 'Couleur',
    icon: 'i-lucide-palette',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'color' }),
  },
  {
    key: 'file',
    label: 'Fichier',
    icon: 'i-lucide-paperclip',
    group: 'Saisie',
    schema: () => ({ type: 'string', format: 'data-url' }),
  },
  {
    key: 'rating',
    label: 'Note',
    icon: 'i-lucide-star',
    group: 'Choix',
    schema: () => ({ type: 'integer', minimum: 1, maximum: 5 }),
    options: () => ({ format: 'rating' }),
  },
  {
    key: 'boolean',
    label: 'Case à cocher',
    icon: 'i-lucide-square-check',
    group: 'Choix',
    schema: () => ({ type: 'boolean' }),
  },
  {
    key: 'enum',
    label: 'Liste déroulante',
    icon: 'i-lucide-list',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
  },
  {
    key: 'radio',
    label: 'Boutons radio',
    icon: 'i-lucide-circle-dot',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
    options: () => ({ format: 'radio' }),
  },
  {
    key: 'select',
    label: 'Liste simple',
    icon: 'i-lucide-chevrons-up-down',
    group: 'Choix',
    schema: () => ({ type: 'string', enum: ['Option A', 'Option B'] }),
    options: () => ({ format: 'select' }),
  },
  {
    key: 'tags',
    label: 'Étiquettes',
    icon: 'i-lucide-tags',
    group: 'Choix',
    schema: () => ({ type: 'array', uniqueItems: true, items: { type: 'string' } }),
    options: () => ({ format: 'tags' }),
  },
  {
    key: 'multi-enum',
    label: 'Cases multiples',
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
    label: 'Date',
    icon: 'i-lucide-calendar',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date' }),
  },
  {
    key: 'datetime',
    label: 'Date et heure',
    icon: 'i-lucide-calendar-clock',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date-time' }),
  },
  {
    key: 'time',
    label: 'Heure',
    icon: 'i-lucide-clock',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'time' }),
  },
  {
    key: 'calendar',
    label: 'Calendrier',
    icon: 'i-lucide-calendar-days',
    group: 'Date & heure',
    schema: () => ({ type: 'string', format: 'date' }),
    options: () => ({ format: 'calendar' }),
  },
  {
    key: 'date-range',
    label: 'Plage de dates',
    icon: 'i-lucide-calendar-range',
    group: 'Date & heure',
    schema: () => ({
      type: 'object',
      properties: {
        start: { type: 'string', format: 'date', title: 'Début' },
        end: { type: 'string', format: 'date', title: 'Fin' },
      },
    }),
    options: () => ({ format: 'calendar', range: true }),
  },
  {
    key: 'array',
    label: 'Liste répétable',
    icon: 'i-lucide-rows-3',
    group: 'Structure',
    schema: () => ({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', title: 'Libellé' },
        },
      },
    }),
    options: () => ({ showSortButtons: true, elementLabelProp: 'label' }),
  },
  {
    key: 'list-with-detail',
    label: 'Liste + détail',
    icon: 'i-lucide-panel-left',
    group: 'Structure',
    schema: () => ({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', title: 'Libellé' },
          notes: { type: 'string', title: 'Notes' },
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
    label: 'Objet',
    icon: 'i-lucide-braces',
    group: 'Structure',
    schema: () => ({
      type: 'object',
      properties: {
        champ: { type: 'string', title: 'Champ' },
      },
    }),
  },
]

export const PALETTE_CONTAINERS: PaletteContainer[] = [
  {
    key: 'VerticalLayout',
    label: 'Colonne',
    icon: 'i-lucide-rows-2',
    create: () => ({ type: 'VerticalLayout', elements: [] }) as UISchemaElement,
  },
  {
    key: 'HorizontalLayout',
    label: 'Ligne',
    icon: 'i-lucide-columns-2',
    create: () => ({ type: 'HorizontalLayout', elements: [] }) as UISchemaElement,
  },
  {
    key: 'Group',
    label: 'Groupe',
    icon: 'i-lucide-square-dashed',
    create: () => ({ type: 'Group', label: 'Nouveau groupe', elements: [] }) as UISchemaElement,
  },
  {
    key: 'Categorization',
    label: 'Onglets',
    icon: 'i-lucide-panels-top-left',
    create: () =>
      ({
        type: 'Categorization',
        elements: [
          { type: 'Category', label: 'Onglet 1', elements: [] },
          { type: 'Category', label: 'Onglet 2', elements: [] },
        ],
      }) as UISchemaElement,
  },
  {
    key: 'Label',
    label: 'Titre',
    icon: 'i-lucide-heading',
    create: () => ({ type: 'Label', text: 'Titre de section' }) as UISchemaElement,
  },
]

export const findPaletteField = (key: string): PaletteField | undefined =>
  PALETTE_FIELDS.find((field) => field.key === key)

export const findPaletteContainer = (key: string): PaletteContainer | undefined =>
  PALETTE_CONTAINERS.find((container) => container.key === key)

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
