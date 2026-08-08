import { describe, expect, it, vi } from 'vitest'
import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'
import {
  collectExtraProperties,
  hasRenderableControl,
  isRenderableObjectSchema,
  useObjectControl,
} from '../../src/composables/useObjectControl'

describe('isRenderableObjectSchema', () => {
  it('accepts a plain object schema', () => {
    expect(isRenderableObjectSchema({ type: 'object', properties: { a: {} } })).toBe(true)
  })

  /** Sans `properties`, le renderer affiche encore les clés hors schéma : il garde la main. */
  it('accepts an object schema without properties', () => {
    expect(isRenderableObjectSchema({ type: 'object' })).toBe(true)
    expect(isRenderableObjectSchema({ type: 'object', additionalProperties: true })).toBe(true)
  })

  it('accepts a union that still declares properties', () => {
    expect(
      isRenderableObjectSchema({ type: ['object', 'boolean'], properties: { a: {} } }),
    ).toBe(true)
  })

  it('accepts patternProperties as renderable content', () => {
    expect(isRenderableObjectSchema({ type: ['object', 'string'], patternProperties: {} })).toBe(
      true,
    )
  })

  /**
   * Le cas `json-editor` : rien à déployer, mais le rang 2 du renderer d'objet battait les
   * renderers scalaires (rang 1) et ne produisait qu'une carte vide.
   */
  it('declines a union without properties, leaving it to a scalar renderer', () => {
    expect(
      isRenderableObjectSchema({
        type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
      }),
    ).toBe(false)
  })

  it('keeps a single-entry object union', () => {
    expect(isRenderableObjectSchema({ type: ['object'] })).toBe(true)
  })

  it('keeps undefined / untyped schemas (type absent ≠ union)', () => {
    expect(isRenderableObjectSchema(undefined)).toBe(true)
    expect(isRenderableObjectSchema({})).toBe(true)
  })

  it('declines a non-object union that mixes scalars only', () => {
    expect(isRenderableObjectSchema({ type: ['string', 'number'] })).toBe(false)
  })

  it('accepts properties even when type is a non-object scalar', () => {
    // Garde-fou : la présence de properties prime sur le type déclaré.
    expect(isRenderableObjectSchema({ type: 'string', properties: { a: {} } })).toBe(true)
  })

  it('declines an object|null union without properties', () => {
    // `type.every(entry => entry === 'object')` est faux : null n'est pas object.
    expect(isRenderableObjectSchema({ type: ['object', 'null'] })).toBe(false)
  })

  it('accepts object|null when properties are present', () => {
    expect(
      isRenderableObjectSchema({
        type: ['object', 'null'],
        properties: { name: { type: 'string' } },
      }),
    ).toBe(true)
  })
})

describe('hasRenderableControl', () => {
  it('accepts a control pointing at a property', () => {
    expect(hasRenderableControl({ type: 'Control', scope: '#/properties/name' })).toBe(true)
  })

  /** Cas dégénéré direct : `Generate.uiSchema` retombe sur l'objet lui-même. */
  it('rejects a control pointing back at the element itself', () => {
    expect(hasRenderableControl({ type: 'Control', scope: '#' })).toBe(false)
    expect(hasRenderableControl({ type: 'Control', scope: '#/' })).toBe(false)
    expect(hasRenderableControl({ type: 'Control' })).toBe(false)
  })

  it('accepts a layout wrapping a real control', () => {
    expect(
      hasRenderableControl({
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/age' }],
      }),
    ).toBe(true)
  })

  /**
   * Le cas manqué : le layout n'est qu'une enveloppe autour d'un contrôle qui revient sur
   * l'élément courant, ce qui reboucle sur le renderer d'objet.
   */
  it('rejects a layout whose only control points at the element itself', () => {
    expect(
      hasRenderableControl({ type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#' }] }),
    ).toBe(false)
  })

  it('looks through nested layouts', () => {
    expect(
      hasRenderableControl({
        type: 'VerticalLayout',
        elements: [{ type: 'Group', elements: [{ type: 'Control', scope: '#/properties/deep' }] }],
      }),
    ).toBe(true)
  })

  it('rejects empty and non-element values', () => {
    expect(hasRenderableControl({ type: 'VerticalLayout', elements: [] })).toBe(false)
    expect(hasRenderableControl(undefined)).toBe(false)
    expect(hasRenderableControl(null)).toBe(false)
    expect(hasRenderableControl('VerticalLayout')).toBe(false)
    expect(hasRenderableControl(42)).toBe(false)
  })

  it('rejects a layout that mixes only self-scopes', () => {
    expect(
      hasRenderableControl({
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#' },
          { type: 'Control', scope: '#/' },
          { type: 'Group', elements: [{ type: 'Control' }] },
        ],
      }),
    ).toBe(false)
  })

  it('accepts when at least one nested control is a real property', () => {
    expect(
      hasRenderableControl({
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            elements: [
              { type: 'Control', scope: '#' },
              { type: 'Control', scope: '#/properties/keep' },
            ],
          },
        ],
      }),
    ).toBe(true)
  })

  it('rejects elements that is not an array', () => {
    expect(hasRenderableControl({ type: 'VerticalLayout', elements: 'oops' })).toBe(false)
    expect(hasRenderableControl({ type: 'VerticalLayout', elements: null })).toBe(false)
  })

  it('aligns with Generate.uiSchema on an empty object (self-scope only)', () => {
    const ui = Generate.uiSchema({ type: 'object' }, 'VerticalLayout')
    expect(hasRenderableControl(ui)).toBe(false)
  })

  it('aligns with Generate.uiSchema on an object with properties', () => {
    const ui = Generate.uiSchema(
      { type: 'object', properties: { name: { type: 'string' } } },
      'VerticalLayout',
    )
    expect(hasRenderableControl(ui)).toBe(true)
  })
})

describe('collectExtraProperties', () => {
  it('lists the keys absent from the schema', () => {
    expect(collectExtraProperties({ a: 1, b: 'x' }, { a: {} })).toEqual([{ key: 'b', value: 'x' }])
  })

  it('serialises nested values', () => {
    expect(collectExtraProperties({ meta: { n: 1 } }, {})).toEqual([
      { key: 'meta', value: '{"n":1}' },
    ])
  })

  it('returns nothing for non-object data', () => {
    expect(collectExtraProperties(['a'], {})).toEqual([])
    expect(collectExtraProperties('a', {})).toEqual([])
    expect(collectExtraProperties(undefined, undefined)).toEqual([])
    expect(collectExtraProperties(null, {})).toEqual([])
    expect(collectExtraProperties(0, {})).toEqual([])
  })

  it('returns nothing when every key is declared', () => {
    expect(collectExtraProperties({ a: 1, b: 2 }, { a: {}, b: {} })).toEqual([])
  })

  it('treats missing properties as empty known set', () => {
    expect(collectExtraProperties({ orphan: true }, undefined)).toEqual([
      { key: 'orphan', value: 'true' },
    ])
  })

  it('stringifies primitives and arrays', () => {
    expect(collectExtraProperties({ n: 3, ok: false, list: [1, 2] }, {})).toEqual([
      { key: 'n', value: '3' },
      { key: 'ok', value: 'false' },
      { key: 'list', value: '[1,2]' },
    ])
  })

  it('stringifies null values as "null"', () => {
    expect(collectExtraProperties({ gone: null }, {})).toEqual([{ key: 'gone', value: 'null' }])
  })
})

describe('useObjectControl', () => {
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

  const mountObject = (state: { value: ControlState }) => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: state.value.rootSchema } })
    const scope = effectScope()
    let result: ReturnType<typeof useObjectControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => state.value)
        result = useObjectControl({
          jsonFormsControl: {
            control,
            handleChange: vi.fn(),
          } as never,
        })
      })
    })

    return { scope, result: result! }
  }

  const baseState = (overrides: Partial<ControlState> = {}): ControlState => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    }

    return {
      schema,
      rootSchema: schema,
      uischema: { type: 'Control', scope: '#/properties/person' },
      path: 'person',
      config: {},
      label: 'Person',
      description: '',
      required: false,
      enabled: true,
      errors: '',
      data: { name: 'Ada', age: 36, legacyId: 99 },
      id: '#/properties/person',
      visible: true,
      ...overrides,
    }
  }

  it('génère une disposition pour les properties déclarées', () => {
    const state = ref(baseState())
    const { result, scope } = mountObject(state)

    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('expose les clés hors schéma via extraProperties', () => {
    const state = ref(baseState())
    const { result, scope } = mountObject(state)

    expect(result.extraProperties.value).toEqual([{ key: 'legacyId', value: '99' }])

    scope.stop()
  })

  it('respecte options.detail', () => {
    const detail: UISchemaElement = {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/name' }],
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
    const { result, scope } = mountObject(state)

    expect(result.detailUiSchema.value).toEqual(detail)
    expect(result.detailUiSchema.value?.elements).toHaveLength(1)

    scope.stop()
  })

  it('renvoie undefined pour un objet sans properties (évite la récursion)', () => {
    const bare: JsonSchema = { type: 'object' }
    const state = ref(baseState({ schema: bare, rootSchema: bare, data: { x: 1 } }))
    const { result, scope } = mountObject(state)

    expect(result.detailUiSchema.value).toBeUndefined()
    expect(result.extraProperties.value).toEqual([{ key: 'x', value: '1' }])

    scope.stop()
  })

  it('met à jour extraProperties quand les données changent', async () => {
    const state = ref(baseState({ data: { name: 'Ada' } }))
    const { result, scope } = mountObject(state)

    expect(result.extraProperties.value).toEqual([])

    state.value = { ...state.value, data: { name: 'Ada', ghost: 'boo' } }
    await nextTick()

    expect(result.extraProperties.value).toEqual([{ key: 'ghost', value: 'boo' }])

    scope.stop()
  })

  it('régénère detailUiSchema quand le schéma change', async () => {
    const state = ref(baseState())
    const { result, scope } = mountObject(state)

    const first = result.detailUiSchema.value
    const nextSchema: JsonSchema = {
      type: 'object',
      properties: { only: { type: 'boolean' } },
    }
    state.value = { ...state.value, schema: nextSchema, rootSchema: nextSchema, data: {} }
    await nextTick()

    expect(result.detailUiSchema.value).not.toBe(first)
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })
})
