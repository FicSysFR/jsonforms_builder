import { describe, expect, it } from 'vitest'
import {
  createSliderAdaptTarget,
  isSliderControl,
  isSliderOption,
  resolveSliderMin,
  resolveSliderMax,
  resolveSliderStep,
} from '../../src/composables/useSliderControl'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'

describe('createSliderAdaptTarget', () => {
  it('keeps finite numbers', () => {
    const adapt = createSliderAdaptTarget(0)
    expect(adapt(12)).toBe(12)
    expect(adapt(0)).toBe(0)
  })

  it('falls back for empty / invalid values', () => {
    const adapt = createSliderAdaptTarget(5)
    expect(adapt(null)).toBe(5)
    expect(adapt(undefined)).toBe(5)
    expect(adapt('')).toBe(5)
    expect(adapt('x')).toBe(5)
  })

  it('parses numeric strings', () => {
    const adapt = createSliderAdaptTarget(-1)
    expect(adapt('3.5')).toBe(3.5)
  })
})

describe('resolveSliderMin / Max / Step', () => {
  it('uses schema bounds with fallbacks', () => {
    expect(resolveSliderMin(10)).toBe(10)
    expect(resolveSliderMin(undefined)).toBe(0)
    expect(resolveSliderMax(20)).toBe(20)
    expect(resolveSliderMax(undefined)).toBe(100)
  })

  it('prefers options.step over multipleOf', () => {
    expect(resolveSliderStep(0.5)).toBe(0.5)
    expect(resolveSliderStep(undefined)).toBe(1)
    expect(resolveSliderStep(2, 0.25)).toBe(0.25)
    expect(resolveSliderStep(2, 0)).toBe(2)
  })
})

describe('isSliderOption / isSliderControl', () => {
  const ctx = { rootSchema: { type: 'object' } as JsonSchema }

  it('accepts true and object slider options', () => {
    expect(isSliderOption({ type: 'Control', options: { slider: true } })).toBe(true)
    expect(isSliderOption({ type: 'Control', options: { slider: { size: 'lg' } } })).toBe(true)
    expect(isSliderOption({ type: 'Control', options: { slider: false } })).toBe(false)
    expect(isSliderOption({ type: 'Control', options: {} })).toBe(false)
  })

  it('matches number controls with min/max and slider option', () => {
    const uischema = {
      type: 'Control',
      scope: '#/properties/volume',
      options: { slider: { color: 'primary' } },
    } as UISchemaElement
    const schema = { type: 'number', minimum: 0, maximum: 100 } as JsonSchema

    expect(isSliderControl(uischema, schema, ctx)).toBe(true)
  })

  it('rejects missing bounds or missing slider option', () => {
    const base = { type: 'Control', scope: '#/properties/volume' } as UISchemaElement

    expect(
      isSliderControl(
        { ...base, options: { slider: true } } as UISchemaElement,
        { type: 'number', minimum: 0 } as JsonSchema,
        ctx,
      ),
    ).toBe(false)

    expect(
      isSliderControl(base, { type: 'number', minimum: 0, maximum: 100 } as JsonSchema, ctx),
    ).toBe(false)
  })

  it('does not require schema.default (unlike stock isRangeControl)', () => {
    const uischema = {
      type: 'Control',
      scope: '#/properties/volume',
      options: { slider: true },
    } as UISchemaElement
    const schema = { type: 'integer', minimum: 0, maximum: 10 } as JsonSchema

    expect(isSliderControl(uischema, schema, ctx)).toBe(true)
  })
})
