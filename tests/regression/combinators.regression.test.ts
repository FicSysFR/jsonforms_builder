/**
 * Non-regression tests — incidents already seen in prod / playground.
 *
 * `REGRESSION:` prefix: a failure here signals a known bug returning, not a
 * simple coverage gap. Each case cites the original symptom.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  Generate,
  isObjectControl,
  rankWith,
  type ControlElement,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import { computed, createApp, effectScope, nextTick, ref, toRaw } from 'vue'
import { flattenAllOfSchema, useAllOfControl } from '../../src/composables/useAllOfControl'
import {
  hasRenderableControl,
  isRenderableObjectSchema,
  useObjectControl,
} from '../../src/composables/useObjectControl'
import {
  isCombinatorItemsArray,
  isCombinatorSchema,
  resolveItemsSchema,
} from '../../src/composables/useArrayControl'
import {
  createVariantValue,
  detectOneOfVariant,
  resolveCombinatorBranches,
} from '../../src/composables/useOneOfControl'
import { useFormBuilder } from '../../src/builder/useFormBuilder'
import { buildNestedAllOfSchema } from '../performance/helpers'
import { resolveWinner } from './testers-mirror'

const bareObjectTester = rankWith(2, isObjectControl)

/** GEDCOM-like chain: person → subject → conclusion. */
const gedcomRoot: JsonSchema = {
  type: 'object',
  definitions: {
    conclusion: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        extracted: { type: 'boolean' },
      },
    },
    subject: {
      allOf: [{ $ref: '#/definitions/conclusion' }, { properties: { media: { type: 'string' } } }],
    },
    person: {
      allOf: [
        { $ref: '#/definitions/subject' },
        {
          properties: {
            private: { type: 'boolean' },
            name: { type: 'string' },
          },
        },
      ],
    },
  },
  properties: {
    person: { $ref: '#/definitions/person' },
    editor: {
      type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
    },
    plain: {
      type: 'object',
      properties: { a: { type: 'string' } },
    },
  },
} as JsonSchema

describe('REGRESSION — dispatch allOf / object / union', () => {
  it('REGRESSION: allOf wins over ObjectControl (else branch props are lost)', () => {
    /**
     * Symptom: the object renderer (rank 2) captured `allOf` schemas and
     * only showed local properties — never those from the branches.
     */
    const ui = { type: 'Control', scope: '#/properties/person' } as ControlElement
    const best = resolveWinner(ui, gedcomRoot, gedcomRoot)

    expect(best).toEqual({ name: 'AllOfControl', rank: 4 })
  })

  it('REGRESSION: union without properties is not ObjectControl (empty card)', () => {
    /**
     * json-editor symptom: `type: […, 'object', …]` without `properties` — object
     * rank 2 beat scalars (rank 1) and only rendered an empty card.
     */
    const ui = { type: 'Control', scope: '#/properties/editor' } as ControlElement
    const context = { rootSchema: gedcomRoot, config: {} }

    expect(bareObjectTester(ui, gedcomRoot, context)).toBe(2)
    expect(isRenderableObjectSchema(gedcomRoot.properties?.editor as JsonSchema)).toBe(false)

    const best = resolveWinner(ui, gedcomRoot, gedcomRoot)
    expect(best?.name).toBe('InputControl')
    expect(best?.rank).toBe(1)
  })

  it('REGRESSION: plain object with properties stays ObjectControl', () => {
    const ui = { type: 'Control', scope: '#/properties/plain' } as ControlElement
    expect(resolveWinner(ui, gedcomRoot, gedcomRoot)).toEqual({ name: 'ObjectControl', rank: 2 })
  })
})

describe('REGRESSION — nested allOf flatten', () => {
  it('REGRESSION: person → subject → conclusion keeps all props', () => {
    /**
     * Symptom: single-level merge → only `private` / `name` remained.
     */
    const person = gedcomRoot.definitions?.person as JsonSchema
    const flattened = flattenAllOfSchema(person, gedcomRoot)

    expect(Object.keys(flattened.properties ?? {}).sort()).toEqual([
      'extracted',
      'id',
      'media',
      'name',
      'private',
    ])
  })

  it('REGRESSION: deep allOf-perf-style chain loses no layer', () => {
    const depth = 8
    const fields = 5
    const root = buildNestedAllOfSchema(depth, fields) as JsonSchema
    const leaf = root.definitions?.[`layer_${depth - 1}`] as JsonSchema
    const flattened = flattenAllOfSchema(leaf, root)

    expect(Object.keys(flattened.properties ?? {})).toHaveLength(depth * fields)
  })
})

describe('REGRESSION — object / allOf anti-recursion', () => {
  it('REGRESSION: Generate on bare object → no descendant control (avoids stack overflow)', () => {
    /**
     * Symptom: self-scope `#` layout redispatched → ObjectControl → same layout → boom.
     */
    const ui = Generate.uiSchema({ type: 'object' }, 'VerticalLayout')
    expect(hasRenderableControl(ui)).toBe(false)
  })

  it('REGRESSION: useObjectControl refuses to redispatch a self-scope', () => {
    const app = createApp({})
    app.provide('jsonforms', { core: { schema: { type: 'object' } } })
    const scope = effectScope()
    let detail: UISchemaElement | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const bare: JsonSchema = { type: 'object' }
        const control = computed(() => ({
          schema: bare,
          rootSchema: bare,
          uischema: { type: 'Control', scope: '#/properties/x' },
          path: 'x',
          config: {},
          label: 'X',
          description: '',
          required: false,
          enabled: true,
          errors: '',
          data: {},
          id: '#/properties/x',
          visible: true,
        }))

        const result = useObjectControl({
          jsonFormsControl: { control, handleChange: vi.fn() } as never,
        })
        detail = result.detailUiSchema.value
      })
    })

    expect(detail).toBeUndefined()
    scope.stop()
  })

  it('REGRESSION: useAllOfControl without mergeable props → no dispatch', () => {
    const app = createApp({})
    const empty: JsonSchema = { allOf: [{ type: 'object' }] }
    app.provide('jsonforms', { core: { schema: empty } })
    const scope = effectScope()
    let detail: UISchemaElement | undefined

    app.runWithContext(() => {
      scope.run(() => {
        const control = computed(() => ({
          schema: empty,
          rootSchema: empty,
          uischema: { type: 'Control', scope: '#' },
          path: '',
          config: {},
          label: '',
          description: '',
          required: false,
          enabled: true,
          errors: '',
          data: {},
          id: '#',
          visible: true,
        }))

        const result = useAllOfControl({
          jsonFormsControl: { control, handleChange: vi.fn() } as never,
        })
        detail = result.detailUiSchema.value
      })
    })

    expect(detail).toBeUndefined()
    scope.stop()
  })
})

describe('REGRESSION — schema identity / allOf UI cache', () => {
  type ControlState = {
    schema: JsonSchema
    rootSchema: JsonSchema
    uischema: { type: string; scope: string; options?: Record<string, unknown> }
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
          jsonFormsControl: { control, handleChange: vi.fn() } as never,
        })
      })
    })

    return { scope, result: result! }
  }

  it('REGRESSION: control schema stays the original (not the flattened one)', () => {
    /**
     * Symptom: a synthetic schema recreated every tick caused
     * `watch(() => props.schema)` to loop → Maximum recursive updates exceeded.
     * The template must dispatch `control.schema` (stable identity).
     */
    const schema = gedcomRoot.definitions?.person as JsonSchema
    const state = ref({
      schema,
      rootSchema: gedcomRoot,
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
    } satisfies ControlState)

    const { result, scope } = mountAllOf(state)

    // Vue proxies: compare identity via toRaw. Contract: no replacement
    // by the flat schema (which no longer has `allOf`).
    expect(toRaw(result.control.value.schema)).toBe(schema)
    expect(result.control.value.schema.allOf).toBeDefined()
    expect(flattenAllOfSchema(schema, gedcomRoot).allOf).toBeUndefined()
    expect(result.detailUiSchema.value).toBeDefined()
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('REGRESSION: errors / data do not remount the allOf layout', async () => {
    /**
     * Symptom: on each JSON Forms invalidation, `Generate.uiSchema` produced
     * a new tree → needless remount (and sometimes a loop) of children.
     */
    const schema = gedcomRoot.definitions?.person as JsonSchema
    const state = ref({
      schema,
      rootSchema: gedcomRoot,
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
    } satisfies ControlState)

    const { result, scope } = mountAllOf(state)
    const first = result.detailUiSchema.value

    state.value = { ...state.value, errors: 'required', data: { private: true } }
    await nextTick()
    expect(result.detailUiSchema.value).toBe(first)

    state.value = { ...state.value, errors: 'other', data: { name: 'Ada' } }
    await nextTick()
    expect(result.detailUiSchema.value).toBe(first)

    scope.stop()
  })
})

describe('REGRESSION — oneOf $ref / allOf in variant', () => {
  it('REGRESSION: no bare $ref branch after resolution', () => {
    /**
     * Symptom: passing `{ $ref }` to the dispatcher → resolveSchema loop
     * (Maximum call stack size exceeded).
     */
    const root: JsonSchema = {
      definitions: {
        address: {
          type: 'object',
          properties: { street: { type: 'string' } },
          required: ['street'],
        },
      },
      type: 'object',
      properties: {
        place: {
          oneOf: [{ $ref: '#/definitions/address' }, { type: 'string' }],
        },
      },
    } as JsonSchema

    const branches = resolveCombinatorBranches(root.properties?.place as JsonSchema, root)

    expect(branches.some((b) => b.$ref !== undefined)).toBe(false)
    expect(branches[0].properties?.street).toBeDefined()
  })

  it('REGRESSION: allOf variant via $ref stays detectable after createVariantValue', () => {
    const root: JsonSchema = {
      definitions: {
        track: {
          allOf: [
            {
              type: 'object',
              required: ['kind'],
              properties: { kind: { const: 'track' } as JsonSchema },
            },
            { properties: { meters: { type: 'integer' } }, required: ['meters'] },
          ],
        },
      },
      oneOf: [{ $ref: '#/definitions/track' }],
    } as JsonSchema

    const branches = resolveCombinatorBranches(root, root)
    expect(branches).toHaveLength(1)
    expect(branches[0].$ref).toBeUndefined()

    // After resolution the branch is still an allOf: flatten to detect it.
    const flat = flattenAllOfSchema(branches[0], root)
    const value = createVariantValue(flat, root) as Record<string, unknown>
    value.meters = 10

    expect(detectOneOfVariant(value, [flat])).toBe(0)
  })
})

describe('REGRESSION — combinator item arrays', () => {
  it('REGRESSION: items $ref → allOf is recognized (else no renderer)', () => {
    /**
     * Symptom: `isObjectArray` / `isPrimitiveArray` require `items.type` ;
     * an `items: { $ref → allOf }` escaped both.
     */
    const uischema = { type: 'Control', scope: '#/properties/entries' } as ControlElement
    const schema: JsonSchema = {
      type: 'object',
      definitions: {
        entity: {
          allOf: [
            { type: 'object', properties: { id: { type: 'string' } } },
            { properties: { note: { type: 'string' } } },
          ],
        },
      },
      properties: {
        entries: { type: 'array', items: { $ref: '#/definitions/entity' } },
      },
    }

    expect(isCombinatorItemsArray(uischema, schema, { rootSchema: schema })).toBe(true)

    const items = resolveItemsSchema(
      (schema.properties!.entries as JsonSchema).items as JsonSchema,
      schema,
    )
    expect(isCombinatorSchema(items)).toBe(true)
  })
})

describe('REGRESSION — builder history / orphans', () => {
  it('REGRESSION: undo after group remove restores schema and uischema', () => {
    /**
     * Symptom: removing a group orphaned (or lost) properties
     * with no clean recovery via undo.
     */
    const scope = effectScope(true)
    let api: ReturnType<typeof useFormBuilder> | undefined
    scope.run(() => {
      api = useFormBuilder()
    })

    api!.addContainer('Group', [], 0)
    api!.addField('text', [0], 0)
    const snapshot = JSON.parse(JSON.stringify(toRaw(api!.definition.value)))

    api!.remove([0])
    expect(api!.definition.value.schema.properties).toEqual({})

    api!.undo()
    expect(toRaw(api!.definition.value)).toEqual(snapshot)

    scope.stop()
  })

  it('REGRESSION: moving a container into itself is a no-op (no commit)', () => {
    const scope = effectScope(true)
    let api: ReturnType<typeof useFormBuilder> | undefined
    scope.run(() => {
      api = useFormBuilder()
    })

    api!.addContainer('Group', [], 0)
    api!.addField('text', [0], 0)
    const before = api!.definition.value

    api!.move([0], [0], 0)
    expect(api!.definition.value).toBe(before)
    // A single commit (addField after addContainer) — move did not add one.
    expect(api!.canUndo.value).toBe(true)
    api!.undo() // text
    api!.undo() // group
    expect(api!.canUndo.value).toBe(false)

    scope.stop()
  })
})
