import { describe, expect, it, vi } from 'vitest'
import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'
import { flattenAllOfSchema, useAllOfControl } from '../../src/composables/useAllOfControl'
import { hasRenderableControl } from '../../src/composables/useObjectControl'
import { buildNestedAllOfSchema } from '../performance/helpers'

/**
 * GEDCOM-like chain: `person` → `subject` → `conclusion`. A single-level merge
 * (the old renderer) only recovered `private` / `gender`.
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
      allOf: [{ $ref: '#/definitions/conclusion' }, { properties: { media: { type: 'string' } } }],
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
  it('recursively merges person → subject → conclusion', () => {
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

  it('follows a root $ref before merging', () => {
    const flattened = flattenAllOfSchema({ $ref: '#/definitions/gender' } as JsonSchema, root)

    expect(flattened.properties?.type).toBeDefined()
    expect(flattened.properties?.id).toBeDefined()
    expect(flattened.required).toContain('type')
  })

  it('does not keep allOf on the result', () => {
    const flattened = flattenAllOfSchema(root.definitions?.person as JsonSchema, root)

    expect(flattened.allOf).toBeUndefined()
  })

  it('tolerates a reference cycle without exploding', () => {
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

  it('produces a layout with real descendant controls', () => {
    const flattened = flattenAllOfSchema(root.definitions?.person as JsonSchema, root)
    const ui = Generate.uiSchema(flattened, 'VerticalLayout', undefined, root)

    expect(hasRenderableControl(ui)).toBe(true)
  })

  it('returns an empty object for a missing or non-object schema', () => {
    expect(flattenAllOfSchema(undefined, root)).toEqual({
      type: 'object',
      properties: {},
      required: [],
    })
    expect(flattenAllOfSchema(null as unknown as JsonSchema, root)).toEqual({
      type: 'object',
      properties: {},
      required: [],
    })
  })

  it('tolerates a broken $ref without throwing', () => {
    const broken = { $ref: '#/definitions/missing', properties: { kept: { type: 'string' } } }
    const flattened = flattenAllOfSchema(broken as JsonSchema, root)

    expect(flattened.properties?.kept).toEqual({ type: 'string' })
  })

  it('merges a literal allOf without $ref', () => {
    const schema: JsonSchema = {
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual(['a', 'b'])
    expect(flattened.required?.sort()).toEqual(['a', 'b'])
  })

  it('deduplicates required repeated across branches', () => {
    const schema: JsonSchema = {
      allOf: [
        { properties: { name: { type: 'string' } }, required: ['name'] },
        { properties: { age: { type: 'integer' } }, required: ['name', 'age'] },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.required).toEqual(['name', 'age'])
  })

  it('lets the last branch win on property conflicts', () => {
    const schema: JsonSchema = {
      allOf: [
        { properties: { status: { type: 'string', enum: ['draft'] } } },
        { properties: { status: { type: 'string', enum: ['published'] } } },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.properties?.status).toEqual({ type: 'string', enum: ['published'] })
  })

  it('keeps local properties in addition to allOf branches', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { local: { type: 'boolean' } },
      required: ['local'],
      allOf: [{ properties: { inherited: { type: 'string' } }, required: ['inherited'] }],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual(['inherited', 'local'])
    expect(flattened.required?.sort()).toEqual(['inherited', 'local'])
  })

  it('merges nested allOf without $ref', () => {
    const schema: JsonSchema = {
      allOf: [
        {
          allOf: [
            { properties: { deep: { type: 'string' } } },
            { properties: { mid: { type: 'number' } } },
          ],
        },
        { properties: { top: { type: 'boolean' } } },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual(['deep', 'mid', 'top'])
  })

  it('stops on a literal allOf cycle (same object)', () => {
    const branch: JsonSchema = { properties: { loop: { type: 'string' } } }
    const schema: JsonSchema = { allOf: [branch] }
    // Intentional cycle: the branch references itself via allOf.
    ;(branch as JsonSchema & { allOf: JsonSchema[] }).allOf = [schema]

    expect(() => flattenAllOfSchema(schema, schema)).not.toThrow()
    const flattened = flattenAllOfSchema(schema, schema)
    expect(flattened.properties?.loop).toBeDefined()
  })

  it('recovers all props from a deep allOf-perf-style chain', () => {
    const depth = 6
    const fieldsPerLayer = 4
    const nested = buildNestedAllOfSchema(depth, fieldsPerLayer) as JsonSchema
    const leaf = nested.definitions?.[`layer_${depth - 1}`] as JsonSchema
    const flattened = flattenAllOfSchema(leaf, nested)

    const expectedKeys = Array.from({ length: depth }, (_, level) =>
      Array.from({ length: fieldsPerLayer }, (_, i) => `l${level}_field_${i}`),
    ).flat()

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual(expectedKeys.sort())
    expect(flattened.allOf).toBeUndefined()
  })

  it('does not mutate the original schema', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
      allOf: [{ properties: { b: { type: 'number' } } }],
    }
    const before = structuredClone(schema)

    flattenAllOfSchema(schema, schema)

    expect(schema).toEqual(before)
  })

  it('treats a schema without allOf as a flat object', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { alone: { type: 'string' } },
      required: ['alone'],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.properties).toEqual({ alone: { type: 'string' } })
    expect(flattened.required).toEqual(['alone'])
  })

  it('accepts an empty allOf', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { only: { type: 'string' } },
      allOf: [],
    }

    expect(flattenAllOfSchema(schema, schema).properties).toEqual({ only: { type: 'string' } })
  })
})

describe('useAllOfControl', () => {
  type ControlState = {
    schema: JsonSchema
    rootSchema: JsonSchema
    uischema: {
      type: string
      scope: string
      options?: Record<string, unknown>
    }
    path: string
    config: Record<string, unknown>
    label: string
    description: string
    required: boolean
    enabled: boolean
    errors: string
    data: unknown
    id: string
    visible: boolean
  }

  const mountAllOf = (state: { value: ControlState }) => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: state.value.rootSchema } })
    const scope = effectScope()
    let result: ReturnType<typeof useAllOfControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => state.value)
        result = useAllOfControl({
          jsonFormsControl: {
            control,
            handleChange: vi.fn(),
          } as never,
        })
      })
    })

    return { scope, result: result!, state }
  }

  const baseState = (overrides: Partial<ControlState> = {}): ControlState => ({
    schema: root.definitions?.person as JsonSchema,
    rootSchema: root,
    uischema: { type: 'Control', scope: '#/properties/person' },
    path: 'person',
    config: {},
    label: 'Person',
    description: '',
    required: false,
    enabled: true,
    errors: '',
    data: {},
    id: '#/properties/person',
    visible: true,
    ...overrides,
  })

  it('generates a layout from the merged allOf schema', () => {
    const state = ref(baseState())
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeDefined()
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('respects options.detail without generating', () => {
    const detail: UISchemaElement = {
      type: 'HorizontalLayout',
      elements: [{ type: 'Control', scope: '#/properties/private' }],
    }
    const state = ref(
      baseState({
        uischema: {
          type: 'Control',
          scope: '#/properties/person',
          options: { detail },
        },
      }),
    )
    const { result, scope } = mountAllOf(state)

    // Vue proxies: assert structure (and that it is not the generated VerticalLayout).
    expect(result.detailUiSchema.value).toEqual(detail)
    expect(result.detailUiSchema.value?.type).toBe('HorizontalLayout')

    scope.stop()
  })

  it('returns undefined if no property is mergeable', () => {
    const empty: JsonSchema = { allOf: [{ type: 'object' }, { type: 'object' }] }
    const state = ref(baseState({ schema: empty, rootSchema: empty }))
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeUndefined()

    scope.stop()
  })

  it('returns undefined if Generate only produces self-scope controls', () => {
    const bare: JsonSchema = { type: 'object' }
    const state = ref(baseState({ schema: bare, rootSchema: bare }))
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeUndefined()

    scope.stop()
  })

  it('memoizes the layout while schema / rootSchema keep the same identity', async () => {
    const schema = root.definitions?.person as JsonSchema
    const state = ref(baseState({ schema, rootSchema: root, errors: '' }))
    const { result, scope } = mountAllOf(state)

    const first = result.detailUiSchema.value
    expect(first).toBeDefined()

    // Typical JSON Forms invalidation (errors): same schema refs → same uiSchema.
    state.value = { ...state.value, errors: 'required', data: { private: true } }
    await nextTick()

    expect(result.detailUiSchema.value).toBe(first)

    scope.stop()
  })

  it('regenerates the layout when schema identity changes', async () => {
    const state = ref(baseState())
    const { result, scope } = mountAllOf(state)

    const first = result.detailUiSchema.value
    expect(first).toBeDefined()

    const nextSchema: JsonSchema = {
      allOf: [{ properties: { only: { type: 'string' } } }],
    }
    state.value = { ...state.value, schema: nextSchema, rootSchema: nextSchema }
    await nextTick()

    expect(result.detailUiSchema.value).not.toBe(first)
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('switches from explicit detail to generation when options.detail disappears', async () => {
    const detail: UISchemaElement = {
      type: 'Group',
      elements: [{ type: 'Control', scope: '#/properties/id' }],
    }
    const state = ref(
      baseState({
        uischema: {
          type: 'Control',
          scope: '#/properties/person',
          options: { detail },
        },
      }),
    )
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toEqual(detail)
    expect(result.detailUiSchema.value?.type).toBe('Group')

    state.value = {
      ...state.value,
      uischema: { type: 'Control', scope: '#/properties/person' },
    }
    await nextTick()

    expect(result.detailUiSchema.value?.type).not.toBe('Group')
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })
})
