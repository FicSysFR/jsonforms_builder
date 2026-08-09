import { describe, expect, it } from 'vitest'
import type { JsonSchema } from '@jsonforms/core'
import {
  createVariantValue,
  detectOneOfVariant,
  resolveCombinatorBranches,
} from '../../src/composables/useOneOfControl'

/**
 * Schema with `$ref`: this is the shape that made `resolveSchema` loop in the browser
 * when the renderer passed the unresolved branch to the dispatcher.
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
  it('follows $refs so each branch is usable', () => {
    const branches = resolveCombinatorBranches(
      refRoot.properties?.addressOrUser as JsonSchema,
      refRoot,
    )

    expect(branches).toHaveLength(2)
    // The guarantee that matters: no bare `$ref` can reach the dispatcher anymore.
    expect(branches.some((b: JsonSchema) => b.$ref !== undefined)).toBe(false)
    expect(branches[0].properties?.street).toBeDefined()
    expect(branches[1].properties?.name).toBeDefined()
  })

  it('leaves already-literal branches untouched', () => {
    const branches = resolveCombinatorBranches({ oneOf: variants } as JsonSchema, refRoot)

    expect(branches).toEqual(variants)
  })

  it('keeps an unresolvable branch rather than dropping it', () => {
    const branches = resolveCombinatorBranches(
      { anyOf: [{ $ref: '#/definitions/inconnu' }] } as JsonSchema,
      refRoot,
    )

    expect(branches).toHaveLength(1)
  })

  it('returns an empty list outside a combinator', () => {
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

  it('fills several consts on the same branch', () => {
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

  it('does not throw on a branch without properties', () => {
    expect(() =>
      createVariantValue({ type: 'object', required: ['x'] }, { type: 'object' }),
    ).not.toThrow()
  })
})

describe('detectOneOfVariant edge cases', () => {
  it('takes the first matching branch when several could', () => {
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

  it('accepts a required without const as long as the key is present', () => {
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

  it('rejects an empty variant list', () => {
    expect(detectOneOfVariant({ kind: 'track' }, [])).toBe(-1)
  })

  it('rejects an array as data', () => {
    expect(detectOneOfVariant(['track'], variants)).toBe(-1)
  })
})

describe('resolveCombinatorBranches edge cases', () => {
  it('prefers oneOf over anyOf when both are present', () => {
    const schema: JsonSchema = {
      oneOf: [{ type: 'string' }],
      anyOf: [{ type: 'number' }],
    }

    expect(resolveCombinatorBranches(schema, refRoot)).toEqual([{ type: 'string' }])
  })

  it('resolves a mix of $refs and literals', () => {
    const schema: JsonSchema = {
      oneOf: [{ $ref: '#/definitions/address' }, { type: 'string', title: 'Libre' }],
    }
    const branches = resolveCombinatorBranches(schema, refRoot)

    expect(branches).toHaveLength(2)
    expect(branches[0].properties?.street).toBeDefined()
    expect(branches[1]).toEqual({ type: 'string', title: 'Libre' })
  })

  it('preserves branch order', () => {
    const schema: JsonSchema = {
      anyOf: [{ $ref: '#/definitions/user' }, { $ref: '#/definitions/address' }],
    }
    const branches = resolveCombinatorBranches(schema, refRoot)

    expect(branches[0].properties?.name).toBeDefined()
    expect(branches[1].properties?.street).toBeDefined()
  })
})
