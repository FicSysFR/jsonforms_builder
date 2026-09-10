import { describe, expect, it } from 'vitest'
import {
  calculateNumericPrecision,
  createNumericAdaptTarget,
  formatNumericValue,
  resolveNumericStep,
  useNumericControl,
} from '../../src/composables/useNumericControl'
import { mountControl } from '../helpers/controlHarness'

describe('resolveNumericStep', () => {
  it('returns integer step when schema type is integer', () => {
    expect(resolveNumericStep({ type: 'integer' })).toBe(1)
  })

  it('prefers configured step over default', () => {
    expect(resolveNumericStep({ type: 'number' }, { step: 0.25 })).toBe(0.25)
  })
})

describe('calculateNumericPrecision', () => {
  it('returns undefined for integer steps', () => {
    expect(calculateNumericPrecision(1)).toBeUndefined()
  })

  it('counts fractional digits', () => {
    expect(calculateNumericPrecision(0.01)).toBe(2)
  })

  it('handles scientific notation', () => {
    expect(calculateNumericPrecision(1e-3)).toBe(3)
  })
})

describe('formatNumericValue', () => {
  it('returns original when value is empty', () => {
    expect(formatNumericValue(null, 2)).toBeNull()
    expect(formatNumericValue('', 2)).toBe('')
  })

  it('formats numbers with precision', () => {
    expect(formatNumericValue(1.2345, 2)).toBe('1.23')
  })

  it('returns non-numeric strings unchanged', () => {
    expect(formatNumericValue('abc', 2)).toBe('abc')
  })
})

describe('createNumericAdaptTarget', () => {
  it('returns clear value for empty input', () => {
    const adapt = createNumericAdaptTarget(undefined)

    expect(adapt('')).toBeUndefined()
  })

  it('coerces strings to numbers', () => {
    const adapt = createNumericAdaptTarget(null)

    expect(adapt('42')).toBe(42)
  })
})

describe('useNumericControl', () => {
  it('combines schema precision with numeric change adaptation', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useNumericControl({ jsonFormsControl, clearValue: null, debounceWait: undefined }),
      {
        schema: { type: 'number', multipleOf: 0.25 },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { step: 0.01 },
        },
        data: 1.234,
      },
    )

    expect(mounted.result.step.value).toBe(0.01)
    expect(mounted.result.precision.value).toBe(2)
    expect(mounted.result.formattedValue.value).toBe('1.23')

    mounted.result.onChange('2.5')
    expect(mounted.handleChange).toHaveBeenCalledWith('value', 2.5)
    mounted.stop()
  })
})
