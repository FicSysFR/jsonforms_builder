import { describe, expect, it } from 'vitest'
import type { JsonSchema } from '@jsonforms/core'
import {
  createVariantValue,
  detectOneOfVariant,
  resolveCombinatorBranches,
} from '../../src/composables/useOneOfControl'

/**
 * Schéma à `$ref` : c'est la forme qui faisait boucler `resolveSchema` côté navigateur
 * quand le renderer transmettait la branche non résolue au dispatcher.
 */
const refRoot: JsonSchema = {
  definitions: {
    address: {
      type: 'object',
      properties: { street: { type: 'string' } },
      required: ['street'],
    },
    user: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  type: 'object',
  properties: {
    addressOrUser: {
      anyOf: [{ $ref: '#/definitions/address' }, { $ref: '#/definitions/user' }],
    },
  },
} as JsonSchema

describe('resolveCombinatorBranches', () => {
  it('suit les $ref pour rendre chaque branche exploitable', () => {
    const branches = resolveCombinatorBranches(
      refRoot.properties?.addressOrUser as JsonSchema,
      refRoot,
    )

    expect(branches).toHaveLength(2)
    // La garantie qui compte : plus aucun `$ref` nu ne peut atteindre le dispatcher.
    expect(branches.some((b: JsonSchema) => b.$ref !== undefined)).toBe(false)
    expect(branches[0].properties?.street).toBeDefined()
    expect(branches[1].properties?.name).toBeDefined()
  })

  it('laisse les branches déjà littérales intactes', () => {
    const branches = resolveCombinatorBranches({ oneOf: variants } as JsonSchema, refRoot)

    expect(branches).toEqual(variants)
  })

  it('conserve une branche irrésolvable plutôt que de l’écarter', () => {
    const branches = resolveCombinatorBranches(
      { anyOf: [{ $ref: '#/definitions/inconnu' }] } as JsonSchema,
      refRoot,
    )

    expect(branches).toHaveLength(1)
  })

  it('renvoie une liste vide hors combinateur', () => {
    expect(resolveCombinatorBranches({ type: 'string' } as JsonSchema, refRoot)).toEqual([])
    expect(resolveCombinatorBranches(undefined, refRoot)).toEqual([])
  })
})

const variants: JsonSchema[] = [
  {
    title: 'Pose de voie',
    type: 'object',
    required: ['kind', 'metersLaid'],
    properties: {
      kind: { const: 'track' } as JsonSchema,
      metersLaid: { type: 'integer' },
    },
  },
  {
    title: 'Caténaire',
    type: 'object',
    required: ['kind', 'polesInstalled'],
    properties: {
      kind: { const: 'catenary' } as JsonSchema,
      polesInstalled: { type: 'integer' },
    },
  },
]

describe('detectOneOfVariant', () => {
  it('matches the branch whose const discriminant and required keys are satisfied', () => {
    expect(detectOneOfVariant({ kind: 'track', metersLaid: 240 }, variants)).toBe(0)
    expect(detectOneOfVariant({ kind: 'catenary', polesInstalled: 4 }, variants)).toBe(1)
  })

  it('returns -1 rather than guessing when nothing matches', () => {
    expect(detectOneOfVariant({}, variants)).toBe(-1)
    expect(detectOneOfVariant({ kind: 'track' }, variants)).toBe(-1)
    expect(detectOneOfVariant(undefined, variants)).toBe(-1)
    expect(detectOneOfVariant('track', variants)).toBe(-1)
  })

  it('rejects a branch whose const discriminant disagrees', () => {
    expect(detectOneOfVariant({ kind: 'catenary', metersLaid: 240 }, variants)).toBe(-1)
  })

  it('ignores branches that declare no required keys', () => {
    expect(detectOneOfVariant({ any: 1 }, [{ type: 'object' }])).toBe(-1)
  })
})

describe('createVariantValue', () => {
  it('fills const discriminants so the branch stays detectable', () => {
    const value = createVariantValue(variants[1], { type: 'object' })

    expect((value as Record<string, unknown>).kind).toBe('catenary')
  })

  it('round-trips through detectOneOfVariant once required fields are filled', () => {
    const value = createVariantValue(variants[0], { type: 'object' }) as Record<string, unknown>
    value.metersLaid = 10

    expect(detectOneOfVariant(value, variants)).toBe(0)
  })

  it('leaves non-object branches untouched', () => {
    expect(createVariantValue({ type: 'string' }, { type: 'object' })).not.toBeInstanceOf(Object)
  })

  it('remplit plusieurs const sur la même branche', () => {
    const variant: JsonSchema = {
      type: 'object',
      required: ['kind', 'mode'],
      properties: {
        kind: { const: 'track' } as JsonSchema,
        mode: { const: 'new' } as JsonSchema,
        metersLaid: { type: 'integer' },
      },
    }

    const value = createVariantValue(variant, { type: 'object' }) as Record<string, unknown>

    expect(value.kind).toBe('track')
    expect(value.mode).toBe('new')
    expect(detectOneOfVariant(value, [variant])).toBe(0)
  })

  it('ne plante pas sur une branche sans properties', () => {
    expect(() => createVariantValue({ type: 'object', required: ['x'] }, { type: 'object' })).not.toThrow()
  })
})

describe('detectOneOfVariant edge cases', () => {
  it('prend la première branche qui matche quand plusieurs pourraient', () => {
    const ambiguous: JsonSchema[] = [
      {
        required: ['shared'],
        properties: { shared: { type: 'string' }, a: { type: 'string' } },
      },
      {
        required: ['shared'],
        properties: { shared: { type: 'string' }, b: { type: 'string' } },
      },
    ]

    expect(detectOneOfVariant({ shared: 'x', a: '1', b: '2' }, ambiguous)).toBe(0)
  })

  it('accepte une required sans const tant que la clé est présente', () => {
    const variantsLocal: JsonSchema[] = [
      {
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    ]

    expect(detectOneOfVariant({ name: 'Ada' }, variantsLocal)).toBe(0)
    expect(detectOneOfVariant({ name: '' }, variantsLocal)).toBe(0)
    expect(detectOneOfVariant({ name: 0 }, variantsLocal)).toBe(0)
    expect(detectOneOfVariant({ name: false }, variantsLocal)).toBe(0)
    expect(detectOneOfVariant({ name: null }, variantsLocal)).toBe(0)
  })

  it('refuse une liste de variantes vide', () => {
    expect(detectOneOfVariant({ kind: 'track' }, [])).toBe(-1)
  })

  it('refuse un tableau comme donnée', () => {
    expect(detectOneOfVariant(['track'], variants)).toBe(-1)
  })
})

describe('resolveCombinatorBranches edge cases', () => {
  it('préfère oneOf à anyOf si les deux sont présents', () => {
    const schema: JsonSchema = {
      oneOf: [{ type: 'string' }],
      anyOf: [{ type: 'number' }],
    }

    expect(resolveCombinatorBranches(schema, refRoot)).toEqual([{ type: 'string' }])
  })

  it('résout un mélange de $ref et de littéraux', () => {
    const schema: JsonSchema = {
      oneOf: [{ $ref: '#/definitions/address' }, { type: 'string', title: 'Libre' }],
    }
    const branches = resolveCombinatorBranches(schema, refRoot)

    expect(branches).toHaveLength(2)
    expect(branches[0].properties?.street).toBeDefined()
    expect(branches[1]).toEqual({ type: 'string', title: 'Libre' })
  })

  it('conserve l’ordre des branches', () => {
    const schema: JsonSchema = {
      anyOf: [
        { $ref: '#/definitions/user' },
        { $ref: '#/definitions/address' },
      ],
    }
    const branches = resolveCombinatorBranches(schema, refRoot)

    expect(branches[0].properties?.name).toBeDefined()
    expect(branches[1].properties?.street).toBeDefined()
  })
})
