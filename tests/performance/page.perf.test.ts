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
 * Chemins chauds de la page playground (`App.vue`) :
 * sélection d'exemple, clonage des données, traduction i18n, validation AJV.
 *
 * On ne monte pas Nuxt UI ici : le coût DOM dépend du navigateur. On mesure
 * la logique de page qui tourne à chaque changement d'exemple / de donnée.
 */

/** Simule le traducteur i18n du playground (lookup radash + fallback). */
const translate = (
  dict: Record<string, unknown>,
  key: string,
  defaultMessage?: string,
): string => {
  const translated = get(dict, key) as string | undefined
  if (translated !== undefined) {
    return translated
  }
  return defaultMessage ?? ''
}

describe('page playground — performances', () => {
  it('charge et trie un catalogue d’exemples volumineux', () => {
    const catalogSize = 200
    const catalog = Array.from({ length: catalogSize }, (_, i) => ({
      name: `example-${String(i).padStart(3, '0')}`,
      label: `Exemple ${catalogSize - i}`,
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
      expect(list[0].label).toBe('Exemple 1')
    })

    expectWithinBudget('catalogue exemples (200)', result, 40)
  })

  it('bascule d’exemple : clone des données + résolution URL (hot path App.vue)', () => {
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

    expectWithinBudget('bascule 40 exemples × 150 champs', result, 80)
  })

  it('résout massivement les clés i18n sans coller les clés brutes', () => {
    const dict = {
      form: Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [
          `field_${i}`,
          { label: `Libellé ${i}`, description: `Description ${i}` },
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
      // label + description présents, « missing » → ''
      expect(hits).toBe(1000)
    })

    expectWithinBudget('i18n 1500 lookups', result, 50)
  })

  it('compile un schéma large et valide les données (createAjv playground)', () => {
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

    expectWithinBudget('AJV compile + validate 200 champs', result, 120)
  })

  it('sérialise le panneau Données (JSON.stringify du playground)', () => {
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

    expectWithinBudget('JSON.stringify panneau données', result, 40)
  })
})
