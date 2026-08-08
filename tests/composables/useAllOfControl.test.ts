import { describe, expect, it } from 'vitest'
import { Generate, type JsonSchema } from '@jsonforms/core'
import { flattenAllOfSchema } from '../../src/composables/useAllOfControl'
import { hasRenderableControl } from '../../src/composables/useObjectControl'

/**
 * Chaîne GEDCOM-like : `person` → `subject` → `conclusion`. Une fusion à un seul
 * niveau (l'ancien renderer) ne récupérait que `private` / `gender`.
 */
const root: JsonSchema = {
  definitions: {
    conclusion: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        extracted: { type: 'boolean' },
      },
    },
    subject: {
      title: 'Subject',
      allOf: [
        { $ref: '#/definitions/conclusion' },
        { properties: { media: { type: 'string' } } },
      ],
    },
    gender: {
      allOf: [
        { $ref: '#/definitions/conclusion' },
        { properties: { type: { type: 'string' } }, required: ['type'] },
      ],
    },
    person: {
      title: 'Person',
      allOf: [
        { $ref: '#/definitions/subject' },
        {
          properties: {
            private: { type: 'boolean' },
            gender: { $ref: '#/definitions/gender' },
          },
        },
      ],
    },
  },
} as JsonSchema

describe('flattenAllOfSchema', () => {
  it('fusionne récursivement person → subject → conclusion', () => {
    const person = root.definitions?.person as JsonSchema
    const flattened = flattenAllOfSchema(person, root)

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual([
      'extracted',
      'gender',
      'id',
      'media',
      'private',
    ])
  })

  it('suit un $ref racine avant de fusionner', () => {
    const flattened = flattenAllOfSchema({ $ref: '#/definitions/gender' } as JsonSchema, root)

    expect(flattened.properties?.type).toBeDefined()
    expect(flattened.properties?.id).toBeDefined()
    expect(flattened.required).toContain('type')
  })

  it('ne conserve pas allOf sur le résultat', () => {
    const flattened = flattenAllOfSchema(root.definitions?.person as JsonSchema, root)

    expect(flattened.allOf).toBeUndefined()
  })

  it('tolère un cycle de références sans exploser', () => {
    const cyclicRoot: JsonSchema = {
      definitions: {
        a: {
          allOf: [{ $ref: '#/definitions/b' }, { properties: { fromA: { type: 'string' } } }],
        },
        b: {
          allOf: [{ $ref: '#/definitions/a' }, { properties: { fromB: { type: 'string' } } }],
        },
      },
    } as JsonSchema

    const flattened = flattenAllOfSchema(cyclicRoot.definitions?.a as JsonSchema, cyclicRoot)

    expect(flattened.properties?.fromA).toBeDefined()
    expect(flattened.properties?.fromB).toBeDefined()
  })

  it('produit une disposition avec de vrais contrôles descendants', () => {
    const flattened = flattenAllOfSchema(root.definitions?.person as JsonSchema, root)
    const ui = Generate.uiSchema(flattened, 'VerticalLayout', undefined, root)

    expect(hasRenderableControl(ui)).toBe(true)
  })
})
