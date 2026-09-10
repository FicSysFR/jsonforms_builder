import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RATING_LENGTH,
  createRatingAdaptTarget,
  resolveRatingLength,
  resolveRatingStep,
  useRatingControl,
} from '../../src/composables/useRatingControl'
import { mountControl } from '../helpers/controlHarness'

describe('resolveRatingLength', () => {
  it('prefers the uischema option', () => {
    expect(resolveRatingLength(10, 5)).toBe(10)
  })

  it('falls back to the schema maximum', () => {
    expect(resolveRatingLength(undefined, 7)).toBe(7)
  })

  it('rounds a fractional maximum', () => {
    expect(resolveRatingLength(undefined, 4.6)).toBe(5)
  })

  it('defaults when nothing constrains it', () => {
    expect(resolveRatingLength(undefined, undefined)).toBe(DEFAULT_RATING_LENGTH)
    expect(resolveRatingLength(-1, 0)).toBe(DEFAULT_RATING_LENGTH)
  })
})

describe('resolveRatingStep', () => {
  it('converts multipleOf into subdivisions per icon', () => {
    expect(resolveRatingStep(0.5)).toBe(2)
    expect(resolveRatingStep(0.25)).toBe(4)
  })

  it('keeps whole icons for integer steps', () => {
    expect(resolveRatingStep(1)).toBe(1)
    expect(resolveRatingStep(2)).toBe(1)
    expect(resolveRatingStep(undefined)).toBe(1)
    expect(resolveRatingStep(0)).toBe(1)
  })
})

describe('createRatingAdaptTarget', () => {
  it('passes numeric ratings through', () => {
    const adapt = createRatingAdaptTarget(undefined)

    expect(adapt(3)).toBe(3)
    expect(adapt('4')).toBe(4)
  })

  it('returns the clear value for empty inputs', () => {
    const adapt = createRatingAdaptTarget(null)

    expect(adapt(null)).toBeNull()
    expect(adapt(undefined)).toBeNull()
    expect(adapt('')).toBeNull()
    expect(adapt('abc')).toBeNull()
  })

  it('treats a reset to zero as "no rating" when the schema forbids it', () => {
    const adapt = createRatingAdaptTarget(undefined, 1)

    expect(adapt(0)).toBeUndefined()
  })

  it('keeps zero when the schema allows it', () => {
    const adapt = createRatingAdaptTarget(undefined, 0)

    expect(adapt(0)).toBe(0)
    expect(createRatingAdaptTarget(undefined)(0)).toBe(0)
  })
})

describe('useRatingControl', () => {
  it('derives display behavior and adapts resets from the live schema', () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useRatingControl({ jsonFormsControl, clearValue: null, debounceWait: undefined }),
      {
        schema: { type: 'number', maximum: 10, minimum: 1, multipleOf: 0.5 },
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { length: 7, clearable: false },
        },
        data: 3.5,
      },
    )

    expect(mounted.result.length.value).toBe(7)
    expect(mounted.result.step.value).toBe(2)
    expect(mounted.result.modelValue.value).toBe(3.5)
    expect(mounted.result.clearable.value).toBe(false)

    mounted.result.onChange(0)
    expect(mounted.handleChange).toHaveBeenCalledWith('value', null)
    mounted.stop()
  })
})
