import { describe, expect, it, vi } from 'vitest'
import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import { computed, createApp, effectScope, nextTick, ref } from 'vue'
import { flattenAllOfSchema, useAllOfControl } from '../../src/composables/useAllOfControl'
import { hasRenderableControl } from '../../src/composables/useObjectControl'
import { buildNestedAllOfSchema } from '../performance/helpers'

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

  it('retourne un objet vide pour un schéma absent ou non-objet', () => {
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

  it('tolère un $ref cassé sans lever', () => {
    const broken = { $ref: '#/definitions/missing', properties: { kept: { type: 'string' } } }
    const flattened = flattenAllOfSchema(broken as JsonSchema, root)

    expect(flattened.properties?.kept).toEqual({ type: 'string' })
  })

  it('fusionne un allOf littéral sans $ref', () => {
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

  it('déduplique les required répétés entre branches', () => {
    const schema: JsonSchema = {
      allOf: [
        { properties: { name: { type: 'string' } }, required: ['name'] },
        { properties: { age: { type: 'integer' } }, required: ['name', 'age'] },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.required).toEqual(['name', 'age'])
  })

  it('laisse la dernière branche gagner en cas de conflit de propriétés', () => {
    const schema: JsonSchema = {
      allOf: [
        { properties: { status: { type: 'string', enum: ['draft'] } } },
        { properties: { status: { type: 'string', enum: ['published'] } } },
      ],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.properties?.status).toEqual({ type: 'string', enum: ['published'] })
  })

  it('conserve les properties locales en plus des branches allOf', () => {
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

  it('fusionne des allOf imbriqués sans $ref', () => {
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

  it('s’arrête sur un cycle allOf littéral (même objet)', () => {
    const branch: JsonSchema = { properties: { loop: { type: 'string' } } }
    const schema: JsonSchema = { allOf: [branch] }
    // Cycle volontaire : la branche se référence elle-même via allOf.
    ;(branch as JsonSchema & { allOf: JsonSchema[] }).allOf = [schema]

    expect(() => flattenAllOfSchema(schema, schema)).not.toThrow()
    const flattened = flattenAllOfSchema(schema, schema)
    expect(flattened.properties?.loop).toBeDefined()
  })

  it('récupère toutes les props d’une chaîne profonde style allOf-perf', () => {
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

  it('ne mute pas le schéma d’origine', () => {
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

  it('traite un schéma sans allOf comme un objet plat', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { alone: { type: 'string' } },
      required: ['alone'],
    }

    const flattened = flattenAllOfSchema(schema, schema)

    expect(flattened.properties).toEqual({ alone: { type: 'string' } })
    expect(flattened.required).toEqual(['alone'])
  })

  it('accepte allOf vide', () => {
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

  it('génère une disposition à partir du schéma allOf fusionné', () => {
    const state = ref(baseState())
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeDefined()
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('respecte options.detail sans générer', () => {
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

    // Proxies Vue : on vérifie la structure (et que ce n’est pas le VerticalLayout généré).
    expect(result.detailUiSchema.value).toEqual(detail)
    expect(result.detailUiSchema.value?.type).toBe('HorizontalLayout')

    scope.stop()
  })

  it('renvoie undefined si aucune propriété n’est fusionnable', () => {
    const empty: JsonSchema = { allOf: [{ type: 'object' }, { type: 'object' }] }
    const state = ref(baseState({ schema: empty, rootSchema: empty }))
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeUndefined()

    scope.stop()
  })

  it('renvoie undefined si Generate ne produit que des contrôles self-scope', () => {
    const bare: JsonSchema = { type: 'object' }
    const state = ref(baseState({ schema: bare, rootSchema: bare }))
    const { result, scope } = mountAllOf(state)

    expect(result.detailUiSchema.value).toBeUndefined()

    scope.stop()
  })

  it('mémorise la disposition tant que schema / rootSchema gardent la même identité', async () => {
    const schema = root.definitions?.person as JsonSchema
    const state = ref(baseState({ schema, rootSchema: root, errors: '' }))
    const { result, scope } = mountAllOf(state)

    const first = result.detailUiSchema.value
    expect(first).toBeDefined()

    // Invalidation typique JSON Forms (erreurs) : mêmes refs schéma → même uiSchema.
    state.value = { ...state.value, errors: 'obligatoire', data: { private: true } }
    await nextTick()

    expect(result.detailUiSchema.value).toBe(first)

    scope.stop()
  })

  it('régénère la disposition quand l’identité du schéma change', async () => {
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

  it('passe de detail explicite à la génération quand options.detail disparaît', async () => {
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
