import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'

/**
 * Un type de champ proposé dans la palette.
 *
 * Chaque entrée sait produire *les deux moitiés* d'un champ : le fragment de JSON Schema
 * (le contrat de donnée) et les options de uischema (le rendu). C'est la seule chose que
 * le builder ait besoin de savoir pour créer un champ — ajouter un type se fait ici,
 * sans toucher aux composants.
 */
export interface PaletteField {
  /** Clé stable, utilisée dans le presse-papier de glisser-déposer. */
  key: string
  label: string
  icon: string
  /** Regroupement affiché dans la palette. */
  group: 'Saisie' | 'Choix' | 'Date & heure' | 'Structure'
  /** Fragment de schéma décrivant la propriété. */
  schema: () => JsonSchema
  /** Options de uischema à poser sur le `Control` (facultatif). */
  options?: () => Record<string, unknown>
}

/**
 * Conteneurs : éléments de uischema qui accueillent d'autres éléments et n'ont
 * aucune contrepartie dans le JSON Schema.
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
    schema: () => ({ type: 'string' }),
    options: () => ({ wysiwyg: true }),
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

/** Un `Control` minimal pointant sur une propriété racine. */
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
