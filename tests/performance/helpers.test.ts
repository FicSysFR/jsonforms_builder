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
  it('aligns properties, data, and controls', () => {
    const count = 5
    const schema = buildFlatObjectSchema(count)
    const data = buildFlatObjectData(count)
    const ui = buildFlatVerticalUiSchema(count)

    expect(Object.keys(schema.properties)).toHaveLength(count)
    expect(Object.keys(data)).toHaveLength(count)
    expect(ui.elements).toHaveLength(count)
    expect(ui.elements[2].scope).toBe('#/properties/field_2')
    expect(data.field_2).toBe('value-2')
  })

  it('accepts a zero count', () => {
    expect(buildFlatObjectSchema(0).properties).toEqual({})
    expect(buildFlatObjectData(0)).toEqual({})
    expect(buildFlatVerticalUiSchema(0).elements).toEqual([])
  })
})

describe('buildDeepUiSchema', () => {
  it('nests Group wrappers around a VerticalLayout', () => {
    const ui = buildDeepUiSchema(2, 2) as {
      type: string
      elements: Array<{ type: string }>
    }

    expect(ui.type).toBe('Group')
    expect(ui.elements[0].type).toBe('Group')
  })
})

describe('buildNestedAllOfSchema', () => {
  it('chains allOf / $ref up to the requested depth', () => {
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

  it('produces depth definitions', () => {
    const root = buildNestedAllOfSchema(5)
    expect(Object.keys(root.definitions)).toHaveLength(5)
  })
})

describe('measure / expectWithinBudget', () => {
  it('returns stats over timed iterations', () => {
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

  it('passes under budget', () => {
    const result = measure(() => undefined, { iterations: 3, warmup: 0 })
    expect(() => expectWithinBudget('noop', result, 50)).not.toThrow()
  })

  it('fails with a diagnostic message beyond budget', () => {
    const result = {
      medianMs: 100,
      p95Ms: 120,
      meanMs: 110,
      samples: [90, 100, 110],
    }

    expect(() => expectWithinBudget('too slow', result, 10)).toThrow(/\[perf\] too slow/)
  })
})
