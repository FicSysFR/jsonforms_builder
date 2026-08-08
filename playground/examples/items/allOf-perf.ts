/**
 * Exemple de stress pour le renderer `allOf` :
 * - chaîne d’héritage profonde via `$ref` + `allOf` (style GEDCOM X)
 * - plusieurs objets racine allOf côte à côte
 * - tableau d’éléments eux-mêmes allOf
 *
 * Ouvrir `?example=allOf-perf` dans le playground pour chronométrer le montage /
 * les interactions (édition d’un booléen, ouverture d’un item de liste).
 */
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { registerExamples } from '../register'

/** Profondeur de la chaîne base → … → leaf (chaque niveau ajoute `fieldsPerLayer` props). */
const DEPTH = 6
/** Propriétés string ajoutées à chaque niveau de la chaîne. */
const FIELDS_PER_LAYER = 8
/** Nombre d’objets allOf distincts à la racine. */
const ROOT_OBJECTS = 4
/** Items préremplis dans le tableau d’entrées allOf. */
const ARRAY_ITEMS = 12

const layerName = (level: number) => `layer_${level}`

const buildLayerDefinitions = (): Record<string, JsonSchema> => {
  const definitions: Record<string, JsonSchema> = {}

  for (let level = 0; level < DEPTH; level++) {
    const properties: Record<string, JsonSchema> = {}
    for (let i = 0; i < FIELDS_PER_LAYER; i++) {
      properties[`l${level}_field_${i}`] = {
        type: 'string',
        title: `L${level} · champ ${i}`,
      }
    }

    if (level === 0) {
      properties.flag = { type: 'boolean', title: 'Flag de base' }
      definitions[layerName(level)] = {
        type: 'object',
        title: `Couche ${level}`,
        properties,
      }
      continue
    }

    definitions[layerName(level)] = {
      title: `Couche ${level}`,
      allOf: [
        { $ref: `#/definitions/${layerName(level - 1)}` },
        {
          type: 'object',
          properties,
        },
      ],
    }
  }

  // Variante « person-like » : allOf sur la feuille + props propres (private / note).
  definitions.entity = {
    title: 'Entity',
    allOf: [
      { $ref: `#/definitions/${layerName(DEPTH - 1)}` },
      {
        type: 'object',
        properties: {
          private: { type: 'boolean', title: 'Privé' },
          note: { type: 'string', title: 'Note' },
        },
      },
    ],
  }

  return definitions
}

const buildEntityData = (seed: number): Record<string, unknown> => {
  const data: Record<string, unknown> = {
    flag: seed % 2 === 0,
    private: seed % 3 === 0,
    note: `note-${seed}`,
  }

  for (let level = 0; level < DEPTH; level++) {
    for (let i = 0; i < FIELDS_PER_LAYER; i++) {
      data[`l${level}_field_${i}`] = `v-${seed}-${level}-${i}`
    }
  }

  return data
}

const definitions = buildLayerDefinitions()

const rootProperties: Record<string, JsonSchema> = {
  entries: {
    type: 'array',
    title: 'Entrées (items allOf)',
    items: { $ref: '#/definitions/entity' },
  },
}

for (let i = 0; i < ROOT_OBJECTS; i++) {
  rootProperties[`entity_${i}`] = {
    $ref: '#/definitions/entity',
  }
}

export const schema: JsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  definitions,
  properties: rootProperties,
}

const data: Record<string, unknown> = {
  entries: Array.from({ length: ARRAY_ITEMS }, (_, i) => buildEntityData(i)),
}

for (let i = 0; i < ROOT_OBJECTS; i++) {
  data[`entity_${i}`] = buildEntityData(100 + i)
}

export const uischema: UISchemaElement = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Objets allOf',
      elements: Array.from({ length: ROOT_OBJECTS }, (_, i) => ({
        type: 'Control',
        scope: `#/properties/entity_${i}`,
      })),
    },
    {
      type: 'Category',
      label: 'Liste allOf',
      elements: [
        {
          type: 'ListWithDetail',
          scope: '#/properties/entries',
        },
      ],
    },
  ],
}

registerExamples([
  {
    name: 'allOf-perf',
    label: 'allOf Perf',
    data,
    schema,
    uischema,
  },
])
