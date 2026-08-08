import { describe, expect, it, vi } from 'vitest'
import type { ControlElement, JsonSchema } from '@jsonforms/core'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'
import {
  isArrayAtCapacity,
  isArrayAtMinimum,
  isCombinatorItemsArray,
  isCombinatorSchema,
  isPrimitiveItemSchema,
  resolveArrayItemLabel,
  resolveItemsSchema,
  useArrayControl,
} from '../../src/composables/useArrayControl'
import { flattenAllOfSchema } from '../../src/composables/useAllOfControl'
import { hasRenderableControl } from '../../src/composables/useObjectControl'

describe('isPrimitiveItemSchema', () => {
  it('recognises scalar item schemas', () => {
    expect(isPrimitiveItemSchema({ type: 'string' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'integer' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'number' })).toBe(true)
    expect(isPrimitiveItemSchema({ type: 'boolean' })).toBe(true)
  })

  it('treats anything with properties as an object, whatever its declared type', () => {
    expect(isPrimitiveItemSchema({ type: 'object', properties: {} })).toBe(false)
    expect(
      isPrimitiveItemSchema({ type: 'string', properties: { a: { type: 'string' } } }),
    ).toBe(false)
  })

  it('resolves union types on their first entry', () => {
    expect(isPrimitiveItemSchema({ type: ['string', 'null'] })).toBe(true)
    expect(isPrimitiveItemSchema({ type: ['object', 'null'] })).toBe(false)
  })

  it('is false for an absent or untyped schema', () => {
    expect(isPrimitiveItemSchema(undefined)).toBe(false)
    expect(isPrimitiveItemSchema({})).toBe(false)
    expect(isPrimitiveItemSchema({ type: 'array' })).toBe(false)
  })
})

describe('resolveArrayItemLabel', () => {
  it('falls back to a 1-based positional label', () => {
    expect(resolveArrayItemLabel({}, 0)).toBe('Élément 1')
    expect(resolveArrayItemLabel({}, 4)).toBe('Élément 5')
  })

  it('uses the configured property when it holds a value', () => {
    const item = { company: 'Entreprise Alpha', count: 6 }

    expect(resolveArrayItemLabel(item, 0, 'company')).toBe('Entreprise Alpha')
  })

  it('stringifies non-string label values', () => {
    expect(resolveArrayItemLabel({ count: 42 }, 0, 'count')).toBe('42')
  })

  it('falls back when the property is missing or empty', () => {
    expect(resolveArrayItemLabel({ company: '' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ other: 'x' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ company: null }, 1, 'company')).toBe('Élément 2')
  })

  it('falls back for primitive items even when a label prop is configured', () => {
    expect(resolveArrayItemLabel('etd', 0, 'company')).toBe('Élément 1')
  })
})

describe('isArrayAtCapacity', () => {
  it('is false when the schema sets no maxItems', () => {
    expect(isArrayAtCapacity(99, undefined)).toBe(false)
  })

  it('blocks once the length reaches maxItems', () => {
    expect(isArrayAtCapacity(2, 3)).toBe(false)
    expect(isArrayAtCapacity(3, 3)).toBe(true)
    expect(isArrayAtCapacity(4, 3)).toBe(true)
  })

  it('treats maxItems of 0 as a hard block', () => {
    expect(isArrayAtCapacity(0, 0)).toBe(true)
  })
})

describe('isArrayAtMinimum', () => {
  it('is false when the schema sets no minItems', () => {
    expect(isArrayAtMinimum(0, undefined)).toBe(false)
  })

  it('blocks removal once the length reaches minItems', () => {
    expect(isArrayAtMinimum(3, 2)).toBe(false)
    expect(isArrayAtMinimum(2, 2)).toBe(true)
    expect(isArrayAtMinimum(1, 2)).toBe(true)
  })
})

describe('resolveItemsSchema', () => {
  const rootSchema: JsonSchema = {
    type: 'object',
    definitions: {
      fileOrFolder: { oneOf: [{ type: 'object' }, { type: 'string' }] },
    },
  }

  it('follows a $ref to its target', () => {
    expect(resolveItemsSchema({ $ref: '#/definitions/fileOrFolder' }, rootSchema)).toEqual(
      rootSchema.definitions!.fileOrFolder,
    )
  })

  it('returns inline schemas untouched', () => {
    const inline: JsonSchema = { type: 'string' }

    expect(resolveItemsSchema(inline, rootSchema)).toBe(inline)
    expect(resolveItemsSchema(undefined, rootSchema)).toBeUndefined()
  })

  it('falls back to the raw items when the $ref cannot be resolved', () => {
    const broken: JsonSchema = { $ref: '#/definitions/missing' }

    expect(resolveItemsSchema(broken, rootSchema)).toBe(broken)
    expect(resolveItemsSchema(broken, undefined)).toBe(broken)
  })
})

describe('isCombinatorItemsArray', () => {
  const uischema: ControlElement = { type: 'Control', scope: '#/properties/children' }

  const schemaWith = (items: JsonSchema | JsonSchema[]): JsonSchema => ({
    type: 'object',
    properties: { children: { type: 'array', items } },
  })

  /** A recursive schema can only express its items via `$ref`: that is the nominal case. */
  it('recognises a combinator reached through a $ref', () => {
    const schema = schemaWith({ $ref: '#/definitions/fileOrFolder' })
    const rootSchema: JsonSchema = {
      ...schema,
      definitions: { fileOrFolder: { oneOf: [{ $ref: '#/definitions/file' }] } },
    }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema })).toBe(true)
  })

  it('recognises an inline combinator', () => {
    const schema = schemaWith({ anyOf: [{ type: 'string' }] })

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema: schema })).toBe(true)
  })

  it('rejects plain object and tuple item schemas', () => {
    const objectItems = schemaWith({ type: 'object' })
    const tupleItems = schemaWith([{ type: 'string' }])

    expect(isCombinatorItemsArray(uischema, objectItems, { rootSchema: objectItems })).toBe(false)
    expect(isCombinatorItemsArray(uischema, tupleItems, { rootSchema: tupleItems })).toBe(false)
  })

  it('rejects a $ref that does not lead to a combinator', () => {
    const schema = schemaWith({ $ref: '#/definitions/file' })
    const rootSchema: JsonSchema = { ...schema, definitions: { file: { type: 'object' } } }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema })).toBe(false)
  })

  /** allOf-perf case: array of `allOf` entities via `$ref`. */
  it('recognises allOf items reached through a $ref', () => {
    const schema = schemaWith({ $ref: '#/definitions/entity' })
    const rootSchema: JsonSchema = {
      ...schema,
      definitions: {
        base: { type: 'object', properties: { id: { type: 'string' } } },
        entity: {
          allOf: [
            { $ref: '#/definitions/base' },
            { properties: { note: { type: 'string' } } },
          ],
        },
      },
    }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema })).toBe(true)
  })

  it('recognises an inline allOf item schema', () => {
    const schema = schemaWith({
      allOf: [{ properties: { a: { type: 'string' } } }, { properties: { b: { type: 'number' } } }],
    })

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema: schema })).toBe(true)
  })

  it('rejects a missing items schema', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { children: { type: 'array' } },
    }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema: schema })).toBe(false)
  })
})

describe('isCombinatorSchema', () => {
  it('detects oneOf, anyOf and allOf', () => {
    expect(isCombinatorSchema({ oneOf: [] })).toBe(true)
    expect(isCombinatorSchema({ anyOf: [{ type: 'string' }] })).toBe(true)
    expect(isCombinatorSchema({ allOf: [{ type: 'object' }] })).toBe(true)
  })

  it('rejects plain schemas and undefined', () => {
    expect(isCombinatorSchema(undefined)).toBe(false)
    expect(isCombinatorSchema({ type: 'object', properties: {} })).toBe(false)
    expect(isCombinatorSchema({ type: 'string' })).toBe(false)
  })
})

describe('allOf array item pipeline', () => {
  /**
   * Guarantees the playground allOf-perf chain: the tester sees a combinator,
   * and the merge produces a layout that can actually be expanded.
   */
  it('flattens $ref allOf items into renderable controls', () => {
    const rootSchema: JsonSchema = {
      type: 'object',
      definitions: {
        layer0: { type: 'object', properties: { flag: { type: 'boolean' } } },
        entity: {
          allOf: [
            { $ref: '#/definitions/layer0' },
            { properties: { note: { type: 'string' } }, required: ['note'] },
          ],
        },
      },
      properties: {
        entries: { type: 'array', items: { $ref: '#/definitions/entity' } },
      },
    }

    const items = resolveItemsSchema(
      (rootSchema.properties?.entries as JsonSchema).items as JsonSchema,
      rootSchema,
    )
    expect(isCombinatorSchema(items)).toBe(true)

    const flattened = flattenAllOfSchema(items, rootSchema)
    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual(['flag', 'note'])
    expect(flattened.required).toContain('note')
    expect(
      hasRenderableControl({
        type: 'VerticalLayout',
        elements: Object.keys(flattened.properties ?? {}).map((key) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        })),
      }),
    ).toBe(true)
  })
})

describe('useArrayControl', () => {
  type ControlState = {
    schema: JsonSchema
    rootSchema: JsonSchema
    arraySchema: JsonSchema
    uischema: ControlElement
    uischemas: unknown[]
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

  const mountArray = (state: { value: ControlState }) => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: state.value.rootSchema } })
    const scope = effectScope()
    const addItem = vi.fn(() => vi.fn())
    const removeItems = vi.fn(() => vi.fn())
    const moveUp = vi.fn(() => vi.fn())
    const moveDown = vi.fn(() => vi.fn())
    let result: ReturnType<typeof useArrayControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => state.value)
        result = useArrayControl({
          jsonFormsControl: {
            control,
            handleChange: vi.fn(),
            addItem,
            removeItems,
            moveUp,
            moveDown,
          } as never,
        })
      })
    })

    return { scope, result: result!, addItem, removeItems, moveUp, moveDown }
  }

  const baseState = (overrides: Partial<ControlState> = {}): ControlState => {
    const itemSchema: JsonSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    }
    const arraySchema: JsonSchema = {
      type: 'array',
      items: itemSchema,
      minItems: 1,
      maxItems: 3,
    }

    return {
      schema: itemSchema,
      rootSchema: { type: 'object', properties: { children: arraySchema } },
      arraySchema,
      uischema: { type: 'Control', scope: '#/properties/children' },
      uischemas: [],
      path: 'children',
      config: {},
      label: 'Children',
      description: '',
      required: false,
      enabled: true,
      errors: '',
      data: [{ name: 'Ada' }],
      id: '#/properties/children',
      visible: true,
      ...overrides,
    }
  }

  it('exposes items / canAdd / canRemove based on minItems and maxItems', () => {
    const state = ref(baseState({ data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }))
    const { result, scope } = mountArray(state)

    expect(result.items.value).toHaveLength(3)
    expect(result.canAdd.value).toBe(false)
    expect(result.canRemove.value).toBe(true)

    scope.stop()
  })

  it('blocks removal at minItems', () => {
    const state = ref(baseState({ data: [{ name: 'only' }] }))
    const { result, scope } = mountArray(state)

    // minItems: 1 and length: 1 → removal forbidden
    expect(result.canRemove.value).toBe(false)
    expect(result.canAdd.value).toBe(true)

    scope.stop()
  })

  it('treats non-array data as an empty list', () => {
    const state = ref(baseState({ data: null }))
    const { result, scope } = mountArray(state)

    expect(result.items.value).toEqual([])
    expect(result.canRemove.value).toBe(false)

    scope.stop()
  })

  it('generates a self-scope Control for combinator items (allOf)', () => {
    const itemSchema: JsonSchema = {
      allOf: [{ properties: { a: { type: 'string' } } }],
    }
    const state = ref(
      baseState({
        schema: itemSchema,
        data: [{}],
        arraySchema: { type: 'array', items: itemSchema },
      }),
    )
    const { result, scope } = mountArray(state)

    expect(result.childUiSchema.value).toEqual({ type: 'Control', scope: '#' })
    expect(result.isPrimitiveItems.value).toBe(false)

    scope.stop()
  })

  it('generates a compact Control for primitive items', () => {
    const itemSchema: JsonSchema = { type: 'string' }
    const state = ref(
      baseState({
        schema: itemSchema,
        data: ['x'],
        arraySchema: { type: 'array', items: itemSchema },
      }),
    )
    const { result, scope } = mountArray(state)

    expect(result.isPrimitiveItems.value).toBe(true)
    expect(result.childUiSchema.value).toMatchObject({
      type: 'Control',
      scope: '#',
      label: false,
      options: { hideDescription: true },
    })

    scope.stop()
  })

  it('composes childPath and itemLabel', () => {
    const state = ref(
      baseState({
        data: [{ name: 'Ada' }, { name: 'Grace' }],
        config: { elementLabelProp: 'name' },
        uischema: {
          type: 'Control',
          scope: '#/properties/children',
          options: { elementLabelProp: 'name' },
        },
      }),
    )
    const { result, scope } = mountArray(state)

    expect(result.childPath(1)).toBe('children.1')
    expect(result.itemLabel(0)).toBe('Ada')
    expect(result.itemLabel(1)).toBe('Grace')

    scope.stop()
  })

  it('delegates addItem / removeItem / moveUp / moveDown to JSON Forms thunks', () => {
    const state = ref(baseState({ data: [{ name: 'a' }, { name: 'b' }] }))
    const { result, scope, addItem, removeItems, moveUp, moveDown } = mountArray(state)

    result.addItem()
    expect(addItem).toHaveBeenCalledWith('children', expect.anything())

    result.removeItem(0)
    expect(removeItems).toHaveBeenCalledWith('children', [0])

    result.moveUp(1)
    expect(moveUp).toHaveBeenCalledWith('children', 1)

    result.moveDown(0)
    expect(moveDown).toHaveBeenCalledWith('children', 0)

    result.moveUp(0)
    expect(moveUp).toHaveBeenCalledTimes(1)

    result.moveDown(1)
    expect(moveDown).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('updates canAdd when the length changes', async () => {
    const state = ref(baseState({ data: [{ name: 'a' }] }))
    const { result, scope } = mountArray(state)

    expect(result.canAdd.value).toBe(true)

    state.value = {
      ...state.value,
      data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    }
    await nextTick()

    expect(result.canAdd.value).toBe(false)

    scope.stop()
  })
})
