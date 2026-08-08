/**
 * Tests de non-régression — incidents déjà vus en prod / playground.
 *
 * Préfixe `REGRESSION:` : un échec ici signale le retour d’un bug connu, pas un
 * simple trou de couverture. Chaque cas cite le symptôme d’origine.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  and,
  Generate,
  isAllOfControl,
  isAnyOfControl,
  isObjectControl,
  isOneOfControl,
  isStringControl,
  or,
  rankWith,
  schemaMatches,
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

/** Miroir des testers réels (object.vue / all-of.vue / one-of.vue / input.vue). */
const objectTester = rankWith(2, and(isObjectControl, schemaMatches(isRenderableObjectSchema)))
const bareObjectTester = rankWith(2, isObjectControl)
const allOfTester = rankWith(4, isAllOfControl)
const oneOfTester = rankWith(3, or(isOneOfControl, isAnyOfControl))
const stringTester = rankWith(1, isStringControl)

const regressionRegistry: Array<{ name: string; tester: ReturnType<typeof rankWith> }> = [
    { name: 'StringControl', tester: stringTester },
    { name: 'ObjectControl', tester: objectTester },
    { name: 'OneOfControl', tester: oneOfTester },
    { name: 'AllOfControl', tester: allOfTester },
  ]

const resolveBest = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  rootSchema: JsonSchema,
): { name: string; rank: number } => {
  const context = { rootSchema, config: {} }
  let best = { name: 'none', rank: -1 }

  for (const entry of regressionRegistry) {
    const rank = entry.tester(uischema, schema, context)
    if (rank > best.rank) {
      best = { name: entry.name, rank }
    }
  }

  return best
}

/** Chaîne GEDCOM-like : person → subject → conclusion. */
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
      allOf: [
        { $ref: '#/definitions/conclusion' },
        { properties: { media: { type: 'string' } } },
      ],
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
  it('REGRESSION: allOf gagne sur ObjectControl (sinon props des branches perdues)', () => {
    /**
     * Symptôme : le renderer d’objet (rang 2) capturait les schémas `allOf` et
     * n’affichait que les properties locales — jamais celles des branches.
     */
    const ui = { type: 'Control', scope: '#/properties/person' } as ControlElement
    const best = resolveBest(ui, gedcomRoot, gedcomRoot)

    expect(best).toEqual({ name: 'AllOfControl', rank: 4 })
    expect(allOfTester(ui, gedcomRoot, { rootSchema: gedcomRoot, config: {} })).toBe(4)
    expect(objectTester(ui, gedcomRoot, { rootSchema: gedcomRoot, config: {} })).toBe(2)
  })

  it('REGRESSION: union sans properties n’est pas ObjectControl (carte vide)', () => {
    /**
     * Symptôme json-editor : `type: […, 'object', …]` sans `properties` — le rang 2
     * objet battait les scalaires (rang 1) et n’affichait qu’une carte vide.
     */
    const ui = { type: 'Control', scope: '#/properties/editor' } as ControlElement
    const context = { rootSchema: gedcomRoot, config: {} }

    expect(bareObjectTester(ui, gedcomRoot, context)).toBe(2)
    expect(objectTester(ui, gedcomRoot, context)).toBe(-1)
    expect(isRenderableObjectSchema(gedcomRoot.properties?.editor as JsonSchema)).toBe(false)

    const best = resolveBest(ui, gedcomRoot, gedcomRoot)
    expect(best.name).toBe('StringControl')
    expect(best.rank).toBe(1)
  })

  it('REGRESSION: objet franc avec properties reste ObjectControl', () => {
    const ui = { type: 'Control', scope: '#/properties/plain' } as ControlElement
    expect(resolveBest(ui, gedcomRoot, gedcomRoot)).toEqual({ name: 'ObjectControl', rank: 2 })
  })
})

describe('REGRESSION — flatten allOf imbriqué', () => {
  it('REGRESSION: person → subject → conclusion conserve toutes les props', () => {
    /**
     * Symptôme : fusion à un seul niveau → seuls `private` / `name` restaient.
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

  it('REGRESSION: chaîne profonde style allOf-perf ne perd aucune couche', () => {
    const depth = 8
    const fields = 5
    const root = buildNestedAllOfSchema(depth, fields) as JsonSchema
    const leaf = root.definitions?.[`layer_${depth - 1}`] as JsonSchema
    const flattened = flattenAllOfSchema(leaf, root)

    expect(Object.keys(flattened.properties ?? {})).toHaveLength(depth * fields)
  })
})

describe('REGRESSION — anti-récursion objet / allOf', () => {
  it('REGRESSION: Generate sur objet nu → pas de contrôle descendant (évite stack overflow)', () => {
    /**
     * Symptôme : layout self-scope `#` redispaché → ObjectControl → même layout → boom.
     */
    const ui = Generate.uiSchema({ type: 'object' }, 'VerticalLayout')
    expect(hasRenderableControl(ui)).toBe(false)
  })

  it('REGRESSION: useObjectControl refuse de redispatcher un self-scope', () => {
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

  it('REGRESSION: useAllOfControl sans props fusionnables → pas de dispatch', () => {
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

describe('REGRESSION — identité schéma / cache UI allOf', () => {
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

  it('REGRESSION: le schéma du control reste l’original (pas le flattened)', () => {
    /**
     * Symptôme : un schéma synthétique recréé à chaque tick faisait reboucler
     * `watch(() => props.schema)` → Maximum recursive updates exceeded.
     * Le template doit dispatcher `control.schema` (identité stable).
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

    // Proxies Vue : comparer l’identité via toRaw. Le contrat : pas de remplacement
    // par le schéma plat (qui n’a plus d’`allOf`).
    expect(toRaw(result.control.value.schema)).toBe(schema)
    expect(result.control.value.schema.allOf).toBeDefined()
    expect(flattenAllOfSchema(schema, gedcomRoot).allOf).toBeUndefined()
    expect(result.detailUiSchema.value).toBeDefined()
    expect(hasRenderableControl(result.detailUiSchema.value)).toBe(true)

    scope.stop()
  })

  it('REGRESSION: erreurs / data ne remountent pas la disposition allOf', async () => {
    /**
     * Symptôme : à chaque invalidation JSON Forms, `Generate.uiSchema` produisait
     * un nouvel arbre → remount inutile (et parfois boucle) des enfants.
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

    state.value = { ...state.value, errors: 'requis', data: { private: true } }
    await nextTick()
    expect(result.detailUiSchema.value).toBe(first)

    state.value = { ...state.value, errors: 'autre', data: { name: 'Ada' } }
    await nextTick()
    expect(result.detailUiSchema.value).toBe(first)

    scope.stop()
  })
})

describe('REGRESSION — oneOf $ref / allOf dans variante', () => {
  it('REGRESSION: aucune branche $ref nue après résolution', () => {
    /**
     * Symptôme : transmettre `{ $ref }` au dispatcher → resolveSchema en boucle
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

  it('REGRESSION: variante allOf via $ref reste détectable après createVariantValue', () => {
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

    // Après résolution, la branche est encore un allOf : on flatten pour détecter.
    const flat = flattenAllOfSchema(branches[0], root)
    const value = createVariantValue(flat, root) as Record<string, unknown>
    value.meters = 10

    expect(detectOneOfVariant(value, [flat])).toBe(0)
  })
})

describe('REGRESSION — tableaux d’items combinator', () => {
  it('REGRESSION: items $ref → allOf est reconnu (sinon aucun renderer)', () => {
    /**
     * Symptôme : `isObjectArray` / `isPrimitiveArray` exigent `items.type` ;
     * un `items: { $ref → allOf }` échappait aux deux.
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
      (schema.properties?.entries as JsonSchema).items as JsonSchema,
      schema,
    )
    expect(isCombinatorSchema(items)).toBe(true)
  })
})

describe('REGRESSION — builder historique / orphelins', () => {
  it('REGRESSION: undo après remove de groupe restaure schéma et uischema', () => {
    /**
     * Symptôme : suppression d’un groupe orphelinait (ou perdait) les propriétés
     * sans pouvoir les récupérer proprement via undo.
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

  it('REGRESSION: move d’un conteneur dans lui-même est un no-op (pas de commit)', () => {
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
    // Un seul commit (addField après addContainer) — move n’en a pas ajouté.
    expect(api!.canUndo.value).toBe(true)
    api!.undo() // text
    api!.undo() // group
    expect(api!.canUndo.value).toBe(false)

    scope.stop()
  })
})
