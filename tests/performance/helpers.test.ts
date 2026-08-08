import { describe, expect, it } from 'vitest'
import {
  buildDeepUiSchema,
  buildFlatObjectData,
  buildFlatObjectSchema,
  buildFlatVerticalUiSchema,
  buildNestedAllOfSchema,
  expectWithinBudget,
  measure,
} from '../performance/helpers'

describe('buildFlatObjectSchema / data / uischema', () => {
  it('aligne propriétés, données et contrôles', () => {
    const count = 5
    const schema = buildFlatObjectSchema(count)
    const data = buildFlatObjectData(count)
    const ui = buildFlatVerticalUiSchema(count)

    expect(Object.keys(schema.properties)).toHaveLength(count)
    expect(Object.keys(data)).toHaveLength(count)
    expect(ui.elements).toHaveLength(count)
    expect(ui.elements[2].scope).toBe('#/properties/field_2')
    expect(data.field_2).toBe('valeur-2')
  })

  it('accepte un count nul', () => {
    expect(buildFlatObjectSchema(0).properties).toEqual({})
    expect(buildFlatObjectData(0)).toEqual({})
    expect(buildFlatVerticalUiSchema(0).elements).toEqual([])
  })
})

describe('buildDeepUiSchema', () => {
  it('empile des Group autour d’un VerticalLayout', () => {
    const ui = buildDeepUiSchema(2, 2) as {
      type: string
      elements: Array<{ type: string }>
    }

    expect(ui.type).toBe('Group')
    expect(ui.elements[0].type).toBe('Group')
  })
})

describe('buildNestedAllOfSchema', () => {
  it('enchaîne allOf / $ref jusqu’à la profondeur demandée', () => {
    const depth = 4
    const fieldsPerLayer = 3
    const root = buildNestedAllOfSchema(depth, fieldsPerLayer)

    expect(root.properties.entity).toEqual({ $ref: '#/definitions/layer_3' })
    expect(root.definitions.layer_0.allOf).toBeUndefined()
    expect(root.definitions.layer_0.properties).toBeDefined()
    expect(Object.keys(root.definitions.layer_0.properties!)).toHaveLength(fieldsPerLayer)

    expect(root.definitions.layer_3.allOf?.[0]).toEqual({ $ref: '#/definitions/layer_2' })
    expect(Object.keys((root.definitions.layer_3.allOf?.[1] as { properties: object }).properties)).toHaveLength(
      fieldsPerLayer,
    )
  })

  it('produit depth définitions', () => {
    const root = buildNestedAllOfSchema(5)
    expect(Object.keys(root.definitions)).toHaveLength(5)
  })
})

describe('measure / expectWithinBudget', () => {
  it('renvoie des stats sur les itérations chronométrées', () => {
    let calls = 0
    const result = measure(
      () => {
        calls += 1
      },
      { iterations: 5, warmup: 2 },
    )

    expect(calls).toBe(7)
    expect(result.samples).toHaveLength(5)
    expect(result.medianMs).toBeGreaterThanOrEqual(0)
    expect(result.p95Ms).toBeGreaterThanOrEqual(result.medianMs)
    expect(result.meanMs).toBeGreaterThanOrEqual(0)
  })

  it('passe sous budget', () => {
    const result = measure(() => undefined, { iterations: 3, warmup: 0 })
    expect(() => expectWithinBudget('noop', result, 50)).not.toThrow()
  })

  it('échoue avec un message diagnostique au-delà du budget', () => {
    const result = {
      medianMs: 100,
      p95Ms: 120,
      meanMs: 110,
      samples: [90, 100, 110],
    }

    expect(() => expectWithinBudget('trop lent', result, 10)).toThrow(/\[perf\] trop lent/)
  })
})
