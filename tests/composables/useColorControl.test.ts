import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COLOR,
  createColorAdaptTarget,
  isHexColor,
  resolveColorFormat,
  toSwatch,
} from '../../src/composables/useColorControl'

describe('resolveColorFormat', () => {
  it('accepts the formats supported by UColorPicker', () => {
    expect(resolveColorFormat('rgb')).toBe('rgb')
    expect(resolveColorFormat('hsl')).toBe('hsl')
  })

  it('falls back to hex', () => {
    expect(resolveColorFormat(undefined)).toBe('hex')
    expect(resolveColorFormat('pantone')).toBe('hex')
  })
})

describe('isHexColor', () => {
  it('accepts the three usual notations', () => {
    expect(isHexColor('#abc')).toBe(true)
    expect(isHexColor('#AABBCC')).toBe(true)
    expect(isHexColor('#aabbccdd')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isHexColor('#ab')).toBe(false)
    expect(isHexColor('aabbcc')).toBe(false)
    expect(isHexColor('#zzzzzz')).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
  })
})

describe('toSwatch', () => {
  it('keeps a valid hexadecimal value', () => {
    expect(toSwatch('#00DC82')).toBe('#00DC82')
  })

  it('falls back on a partial hexadecimal value', () => {
    expect(toSwatch('#00D')).toBe('#00D')
    expect(toSwatch('#00DC8')).toBe(DEFAULT_COLOR)
  })

  it('trusts non-hexadecimal CSS colours', () => {
    expect(toSwatch('rgb(0 220 130)')).toBe('rgb(0 220 130)')
    expect(toSwatch(' rebeccapurple ')).toBe('rebeccapurple')
  })

  it('uses the fallback when empty', () => {
    expect(toSwatch(undefined)).toBe(DEFAULT_COLOR)
    expect(toSwatch('   ')).toBe(DEFAULT_COLOR)
    expect(toSwatch(undefined, '#fff')).toBe('#fff')
  })
})

describe('createColorAdaptTarget', () => {
  it('trims the emitted value', () => {
    expect(createColorAdaptTarget(undefined)(' #fff ')).toBe('#fff')
  })

  it('returns the clear value when empty', () => {
    const adapt = createColorAdaptTarget(null)

    expect(adapt('')).toBeNull()
    expect(adapt('   ')).toBeNull()
    expect(adapt(undefined)).toBeNull()
  })
})
