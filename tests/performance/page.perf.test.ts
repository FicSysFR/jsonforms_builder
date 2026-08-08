import { describe, expect, it } from 'vitest'
import { get } from 'radash'
import { createAjv } from '../../src/utils/validator'
import {
  buildFlatObjectData,
  buildFlatObjectSchema,
  buildFlatVerticalUiSchema,
  expectWithinBudget,
  measure,
} from './helpers'

/**
 * Hot paths of the playground page (`App.vue`):
 * example selection, data cloning, i18n translation, AJV validation.
 *
 * Nuxt UI is not mounted here: DOM cost depends on the browser. We measure
 * page logic that runs on every example / data change.
 */

/** Simulates the playground i18n translator (radash lookup + fallback). */
const translate = (dict: Record<string, unknown>, key: string, defaultMessage?: string): string => {
  const translated = get(dict, key) as string | undefined
  if (translated !== undefined) {
    return translated
  }
  return defaultMessage ?? ''
}

describe('playground page — performance', () => {
  it('loads and sorts a large example catalog', () => {
    const catalogSize = 200
    const catalog = Array.from({ length: catalogSize }, (_, i) => ({
      name: `example-${String(i).padStart(3, '0')}`,
      label: `Example ${catalogSize - i}`,
      data: { n: i },
      schema: { type: 'object' as const, properties: {} },
      uischema: { type: 'VerticalLayout' as const, elements: [] },
    }))

    const result = measure(() => {
      const known: Record<string, (typeof catalog)[number]> = {}
      for (const example of catalog) {
        known[example.name] = example
      }
      const list = Object.keys(known).map((key) => known[key])
      list.sort((a, b) => a.label.localeCompare(b.label))
      expect(list).toHaveLength(catalogSize)
      expect(list[0].label).toBe('Example 1')
    })

    expectWithinBudget('example catalog (200)', result, 40)
  })

  it('switches example: clone data + URL resolution (App.vue hot path)', () => {
    const fieldCount = 150
    const examples = Array.from({ length: 40 }, (_, i) => ({
      name: `form-${i}`,
      schema: buildFlatObjectSchema(fieldCount),
      uischema: buildFlatVerticalUiSchema(fieldCount),
      data: buildFlatObjectData(fieldCount),
    }))

    let selected = examples[0].name
    let data: Record<string, unknown> = { ...examples[0].data }

    const result = measure(() => {
      for (const example of examples) {
        selected = example.name
        const params = new URLSearchParams('?example=old')
        params.set('example', selected)
        const query = `?${params.toString()}`
        data = { ...(example.data ?? {}) }
        expect(query).toContain(selected)
        expect(Object.keys(data)).toHaveLength(fieldCount)
      }
    })

    expectWithinBudget('switch 40 examples × 150 fields', result, 80)
  })

  it('resolves i18n keys in bulk without sticking raw keys', () => {
    const dict = {
      form: Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [
          `field_${i}`,
          { label: `Label ${i}`, description: `Description ${i}` },
        ]),
      ),
    }

    const keys = Array.from({ length: 500 }, (_, i) => [
      `form.field_${i}.label`,
      `form.field_${i}.description`,
      `form.field_${i}.missing`,
    ]).flat()

    const result = measure(() => {
      let hits = 0
      for (const key of keys) {
        const value = translate(dict, key, undefined)
        if (value !== '') hits += 1
      }
      // label + description present, 'missing' → ''
      expect(hits).toBe(1000)
    })

    expectWithinBudget('i18n 1500 lookups', result, 50)
  })

  it('compiles a large schema and validates data (playground createAjv)', () => {
    const fieldCount = 200
    const schema = buildFlatObjectSchema(fieldCount)
    const validData = buildFlatObjectData(fieldCount)
    const invalidData = { ...validData, field_0: 42 }

    const result = measure(() => {
      const ajv = createAjv()
      const validate = ajv.compile(schema)
      expect(validate(validData)).toBe(true)
      expect(validate(invalidData)).toBe(false)
    })

    expectWithinBudget('AJV compile + validate 200 fields', result, 120)
  })

  it('serializes the Data panel (playground JSON.stringify)', () => {
    const data = {
      meta: { title: 'perf', nested: { a: 1, b: [1, 2, 3] } },
      items: Array.from({ length: 400 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        tags: [`t-${i % 7}`, `u-${i % 11}`],
      })),
    }

    const result = measure(() => {
      const pretty = JSON.stringify(data, null, 2)
      expect(pretty.length).toBeGreaterThan(10_000)
    })

    expectWithinBudget('JSON.stringify data panel', result, 40)
  })
})
