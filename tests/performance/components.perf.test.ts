import { describe, expect, it } from 'vitest'
import type { Component } from 'vue'
import {
  and,
  formatIs,
  hasOption,
  isAllOfControl,
  isBooleanControl,
  isDateControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isMultiLineControl,
  isNumberControl,
  isObjectControl,
  isOneOfControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
  uiTypeIs,
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import {
  resolveArrayItemLabel,
  isPrimitiveItemSchema,
  isArrayAtCapacity,
} from '../../src/composables/useArrayControl'
import { flattenAllOfSchema } from '../../src/composables/useAllOfControl'
import {
  detectOneOfVariant,
  resolveCombinatorBranches,
  createVariantValue,
} from '../../src/composables/useOneOfControl'
import {
  mapSuggestionsToOptions,
  resolveFetchedOptions,
} from '../../src/composables/useAutocompleteControl'
import { normalizeSuggestions } from '../../src/composables/useEnumSuggestionControl'
import {
  formatNumericValue,
  calculateNumericPrecision,
} from '../../src/composables/useNumericControl'
import {
  buildDeepUiSchema,
  buildFlatObjectSchema,
  buildFlatVerticalUiSchema,
  buildNestedAllOfSchema,
  expectWithinBudget,
  measure,
} from './helpers'

/**
 * Component-path performance: renderer resolution (testers),
 * array labels, oneOf / allOf combinators, suggestions.
 *
 * Vue SFCs are not imported (they pull `@nuxt/ui` and Nuxt aliases).
 * The registry below reuses the *same* `rankWith` predicates as the
 * package renderers, so we time the real selection cost.
 */

const stubRenderer = {} as Component

const componentTesters: JsonFormsRendererRegistryEntry[] = [
  { tester: rankWith(1, isStringControl), renderer: stubRenderer },
  { tester: rankWith(2, and(isStringControl, formatIs('password'))), renderer: stubRenderer },
  { tester: rankWith(2, and(isStringControl, isMultiLineControl)), renderer: stubRenderer },
  { tester: rankWith(3, and(isStringControl, optionIs('wysiwyg', true))), renderer: stubRenderer },
  { tester: rankWith(2, and(isStringControl, hasOption('suggestion'))), renderer: stubRenderer },
  { tester: rankWith(1, isBooleanControl), renderer: stubRenderer },
  { tester: rankWith(1, or(isIntegerControl, isNumberControl)), renderer: stubRenderer },
  { tester: rankWith(2, isDateControl), renderer: stubRenderer },
  { tester: rankWith(2, isEnumControl), renderer: stubRenderer },
  { tester: rankWith(20, and(isEnumControl, optionIs('format', 'radio'))), renderer: stubRenderer },
  { tester: rankWith(2, isObjectControl), renderer: stubRenderer },
  { tester: rankWith(3, isOneOfControl), renderer: stubRenderer },
  { tester: rankWith(4, isAllOfControl), renderer: stubRenderer },
  { tester: rankWith(1, isLayout), renderer: stubRenderer },
  { tester: rankWith(1, uiTypeIs('Group')), renderer: stubRenderer },
  { tester: rankWith(1, uiTypeIs('Label')), renderer: stubRenderer },
]

type TesterContext = {
  rootSchema: JsonSchema
  config: Record<string, unknown>
}

const resolveBestRenderer = (
  renderers: JsonFormsRendererRegistryEntry[],
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext,
) => {
  let bestRank = -1

  for (const entry of renderers) {
    const rank = entry.tester(uischema, schema, context)
    if (rank > bestRank) {
      bestRank = rank
    }
  }

  return bestRank
}

describe('components — renderer resolution', () => {
  it('resolves the best renderer for a dense flat form', () => {
    const count = 120
    const schema = buildFlatObjectSchema(count) as JsonSchema
    const uischema = buildFlatVerticalUiSchema(count) as UISchemaElement
    const context: TesterContext = { rootSchema: schema, config: {} }
    const elements = (uischema as { elements: UISchemaElement[] }).elements

    const result = measure(() => {
      let matched = 0
      for (const element of elements) {
        const property = (element as { scope?: string }).scope?.split('/').pop()
        const propSchema = property
          ? (schema.properties as Record<string, JsonSchema>)[property]
          : schema
        const bestRank = resolveBestRenderer(
          componentTesters,
          element,
          propSchema ?? schema,
          context,
        )
        if (bestRank >= 0) matched += 1
      }
      expect(matched).toBe(count)
    })

    expectWithinBudget('testers 120 string controls', result, 80)
  })

  it('evaluates the full registry on a panel of typical controls', () => {
    const schema = {
      type: 'object',
      properties: {
        text: { type: 'string' },
        rich: { type: 'string' },
        flag: { type: 'boolean' },
        amount: { type: 'number' },
        when: { type: 'string', format: 'date' },
        choice: { type: 'string', enum: ['a', 'b', 'c'] },
        nested: {
          type: 'object',
          properties: { child: { type: 'string' } },
        },
        variant: {
          oneOf: [
            { type: 'object', properties: { kind: { const: 'a' } }, required: ['kind'] },
            { type: 'object', properties: { kind: { const: 'b' } }, required: ['kind'] },
          ],
        },
      },
    } as JsonSchema

    const cases: Array<{ uischema: UISchemaElement; schema: JsonSchema }> = [
      {
        uischema: { type: 'Control', scope: '#/properties/text' } as UISchemaElement,
        schema: schema.properties!.text as JsonSchema,
      },
      {
        uischema: {
          type: 'Control',
          scope: '#/properties/rich',
          options: { wysiwyg: true },
        } as UISchemaElement,
        schema: schema.properties!.rich as JsonSchema,
      },
      {
        uischema: { type: 'Control', scope: '#/properties/flag' } as UISchemaElement,
        schema: schema.properties!.flag as JsonSchema,
      },
      {
        uischema: { type: 'Control', scope: '#/properties/amount' } as UISchemaElement,
        schema: schema.properties!.amount as JsonSchema,
      },
      {
        uischema: { type: 'Control', scope: '#/properties/when' } as UISchemaElement,
        schema: schema.properties!.when as JsonSchema,
      },
      {
        uischema: {
          type: 'Control',
          scope: '#/properties/choice',
          options: { format: 'radio' },
        } as UISchemaElement,
        schema: schema.properties!.choice as JsonSchema,
      },
      {
        uischema: { type: 'Control', scope: '#/properties/nested' } as UISchemaElement,
        // `isObjectControl` resolves the scope against the passed schema: root is required.
        schema,
      },
      {
        uischema: { type: 'Control', scope: '#/properties/variant' } as UISchemaElement,
        schema: schema.properties!.variant as JsonSchema,
      },
      { uischema: { type: 'VerticalLayout', elements: [] } as UISchemaElement, schema },
      { uischema: { type: 'Label', text: 'Title' } as UISchemaElement, schema },
    ]

    const context: TesterContext = { rootSchema: schema, config: {} }

    const result = measure(() => {
      for (let round = 0; round < 50; round++) {
        for (const entry of cases) {
          const bestRank = resolveBestRenderer(
            componentTesters,
            entry.uischema,
            entry.schema,
            context,
          )
          // A -1 rank would signal a hole in the mirrored renderer registry.
          if (bestRank < 0) {
            throw new Error(
              `no tester for type=${entry.uischema.type} scope=${(entry.uischema as ControlElement).scope}`,
            )
          }
        }
      }
    })

    expectWithinBudget('tester registry × 50 rounds (10 cases)', result, 100)
  })

  it('stays fast on a deeply nested uischema', () => {
    const deep = buildDeepUiSchema(8, 4) as UISchemaElement
    const rootSchema = { type: 'object', properties: {} } as JsonSchema
    const stringSchema = { type: 'string' } as JsonSchema
    const context: TesterContext = { rootSchema, config: {} }

    const schemaFor = (node: UISchemaElement): JsonSchema =>
      node.type === 'Control' ? stringSchema : rootSchema

    const walk = (node: UISchemaElement): number => {
      const bestRank = resolveBestRenderer(componentTesters, node, schemaFor(node), context)
      expect(bestRank).toBeGreaterThanOrEqual(0)
      const children = (node as { elements?: UISchemaElement[] }).elements ?? []
      return 1 + children.reduce((sum, child) => sum + walk(child), 0)
    }

    const result = measure(() => {
      const visited = walk(deep)
      expect(visited).toBeGreaterThan(20)
    })

    expectWithinBudget('uischema walk depth 8', result, 60)
  })
})

describe('components — arrays and controls', () => {
  it('computes labels for a large object array', () => {
    const items = Array.from({ length: 2_000 }, (_, i) => ({
      // One in 17 without a label → fallback to « Élément N » (production string)
      company: i % 17 === 1 ? '' : `Company ${i}`,
      count: i,
    }))

    const result = measure(() => {
      const labels = items.map((item, index) => resolveArrayItemLabel(item, index, 'company'))
      expect(labels[0]).toBe('Company 0')
      expect(labels[1]).toBe('Élément 2')
      expect(labels).toHaveLength(2_000)
    })

    expectWithinBudget('resolveArrayItemLabel × 2000', result, 40)
  })

  it('evaluates capacity guards over a long add series', () => {
    const result = measure(() => {
      let length = 0
      const maxItems = 5_000
      while (!isArrayAtCapacity(length, maxItems)) {
        length += 1
      }
      expect(length).toBe(maxItems)
      expect(isPrimitiveItemSchema({ type: 'string' })).toBe(true)
    })

    expectWithinBudget('isArrayAtCapacity up to 5000', result, 20)
  })

  it('detects the oneOf variant on a dense branch set', () => {
    const branches = Array.from({ length: 80 }, (_, i) => ({
      type: 'object' as const,
      properties: {
        kind: { const: `type-${i}` },
        value: { type: 'string' as const },
      },
      required: ['kind'],
    }))

    const schema = { oneOf: branches } as JsonSchema
    const data = { kind: 'type-42', value: 'ok' }

    const result = measure(() => {
      for (let i = 0; i < 100; i++) {
        const resolved = resolveCombinatorBranches(schema, schema)
        expect(resolved).toHaveLength(80)
        const index = detectOneOfVariant(data, resolved)
        expect(index).toBe(42)
        const created = createVariantValue(resolved[0], schema)
        expect(created).toHaveProperty('kind')
      }
    })

    expectWithinBudget('oneOf 80 branches × 100', result, 80)
  })

  it('flattens a deep allOf / $ref chain (playground allOf-perf mirror)', () => {
    const depth = 8
    const fieldsPerLayer = 12
    const root = buildNestedAllOfSchema(depth, fieldsPerLayer) as JsonSchema
    const leaf = root.definitions?.[`layer_${depth - 1}`] as JsonSchema
    const expectedProps = depth * fieldsPerLayer

    const result = measure(() => {
      for (let i = 0; i < 200; i++) {
        const flattened = flattenAllOfSchema(leaf, root)
        expect(Object.keys(flattened.properties ?? {})).toHaveLength(expectedProps)
        expect(flattened.allOf).toBeUndefined()
      }
    })

    expectWithinBudget('flattenAllOfSchema depth 8 × 200', result, 120)
  })

  it('normalizes and maps large suggestion lists', () => {
    const raw = Array.from({ length: 3_000 }, (_, i) => `plain-${i}`)

    const result = measure(() => {
      const normalized = normalizeSuggestions(raw)
      expect(normalized).toHaveLength(3_000)

      const mapped = mapSuggestionsToOptions(Array.from({ length: 1_500 }, (_, i) => `s-${i}`))
      expect(mapped).toHaveLength(1_500)

      const fetched = resolveFetchedOptions(
        Array.from({ length: 800 }, (_, i) => ({
          name: `N${i}`,
          id: `id-${i}`,
        })),
        {
          url: 'https://example.test/search',
          labelKey: 'name',
          valueKey: 'id',
        },
      )
      expect(fetched).toHaveLength(800)
    })

    expectWithinBudget('suggestions / autocomplete bulk', result, 60)
  })

  it('formats numeric values in a loop (slider / numeric)', () => {
    const result = measure(() => {
      let checksum = 0
      for (let i = 0; i < 5_000; i++) {
        const precision = calculateNumericPrecision(0.001)
        const formatted = formatNumericValue(i * 0.001, precision)
        checksum += String(formatted).length
      }
      expect(checksum).toBeGreaterThan(0)
    })

    expectWithinBudget('formatNumericValue × 5000', result, 40)
  })
})
