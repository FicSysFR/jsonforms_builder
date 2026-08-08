/**
 * Stress example for the `allOf` renderer:
 * - deep inheritance chain via `$ref` + `allOf` (GEDCOM X style)
 * - several root allOf objects side by side
 * - array of items that are themselves allOf
 *
 * Open `?example=allOf-perf` in the playground to time mount /
 * interactions (editing a boolean, opening a list item).
 */
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { registerExamples } from '../register'

/** Depth of the base → … → leaf chain (each level adds `fieldsPerLayer` props). */
const DEPTH = 6
/** String properties added at each level of the chain. */
const FIELDS_PER_LAYER = 8
/** Number of distinct allOf objects at the root. */
const ROOT_OBJECTS = 4
/** Pre-filled items in the allOf entries array. */
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

  // « person-like » variant: allOf on the leaf + own props (private / note).
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
