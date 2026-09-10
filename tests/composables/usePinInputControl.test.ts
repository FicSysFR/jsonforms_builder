import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PIN_LENGTH,
  createPinAdaptTarget,
  readPatternLength,
  resolvePinLength,
  resolvePinType,
  splitPinValue,
  usePinInputControl,
} from '../../src/composables/usePinInputControl'
import { mountControl } from '../helpers/controlHarness'

describe('readPatternLength', () => {
  it('reads a fixed quantifier', () => {
    expect(readPatternLength('^\\d{6}$')).toBe(6)
  })

  it('keeps the upper bound of a range', () => {
    expect(readPatternLength('^\\d{4,8}$')).toBe(8)
  })

  it('returns undefined without a quantifier', () => {
    expect(readPatternLength('^\\d+$')).toBeUndefined()
    expect(readPatternLength(undefined)).toBeUndefined()
  })
})

describe('resolvePinLength', () => {
  it('prefers the uischema option', () => {
    expect(resolvePinLength(8, { maxLength: 4 })).toBe(8)
  })

  it('falls back to maxLength, then minLength', () => {
    expect(resolvePinLength(undefined, { maxLength: 4 })).toBe(4)
    expect(resolvePinLength(undefined, { minLength: 3 })).toBe(3)
  })

  it('derives the length from the pattern', () => {
    expect(resolvePinLength(undefined, { pattern: '^\\d{6}$' })).toBe(6)
  })

  it('defaults when nothing constrains it', () => {
    expect(resolvePinLength(undefined, undefined)).toBe(DEFAULT_PIN_LENGTH)
    expect(resolvePinLength(0, {})).toBe(DEFAULT_PIN_LENGTH)
  })
})

describe('createPinAdaptTarget', () => {
  it('joins the cells into the schema string', () => {
    const adapt = createPinAdaptTarget(undefined)

    expect(adapt(['1', '2', '3'])).toBe('123')
  })

  it('returns the clear value for an empty pin', () => {
    const adapt = createPinAdaptTarget(null)

    expect(adapt([])).toBeNull()
    expect(adapt('')).toBeNull()
    expect(adapt(undefined)).toBeNull()
  })

  it('accepts an already joined value', () => {
    const adapt = createPinAdaptTarget(undefined)

    expect(adapt('4821')).toBe('4821')
    expect(adapt(4821)).toBe('4821')
  })
})

describe('splitPinValue', () => {
  it('splits the stored string into cells', () => {
    expect(splitPinValue('482')).toEqual(['4', '8', '2'])
    expect(splitPinValue(482)).toEqual(['4', '8', '2'])
  })

  it('yields an empty array for missing data', () => {
    expect(splitPinValue(undefined)).toEqual([])
    expect(splitPinValue(null)).toEqual([])
  })
})

describe('resolvePinType', () => {
  it('honours an explicit option', () => {
    expect(resolvePinType('text', '^\\d{4}$')).toBe('text')
    expect(resolvePinType('number', undefined)).toBe('number')
  })

  it('detects a digits-only pattern', () => {
    expect(resolvePinType(undefined, '^\\d{6}$')).toBe('number')
    expect(resolvePinType(undefined, '^[0-9]{6}$')).toBe('number')
  })

  it('stays textual otherwise', () => {
    expect(resolvePinType(undefined, undefined)).toBe('text')
    expect(resolvePinType(undefined, '^[A-Z0-9]{8}$')).toBe('text')
  })
})

describe('usePinInputControl', () => {
  it('derives cells and confidential input options', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        usePinInputControl({ jsonFormsControl, clearValue: null, debounceWait: undefined }),
      {
        schema: { type: 'string', pattern: '^\\d{6}$' },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { mask: true, otp: true },
        },
        data: '123456',
      },
    )

    expect(mounted.result.length.value).toBe(6)
    expect(mounted.result.pinType.value).toBe('number')
    expect(mounted.result.mask.value).toBe(true)
    expect(mounted.result.otp.value).toBe(true)
    expect(mounted.result.modelValue.value).toEqual(['1', '2', '3', '4', '5', '6'])

    mounted.result.onChange(['6', '5', '4', '3', '2', '1'])
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '654321')
    mounted.stop()
  })
})
