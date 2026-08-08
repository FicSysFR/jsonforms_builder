import { describe, expect, it } from 'vitest'
import { parseHash, stringifyHash } from '../../src/composables/useHashState'

describe('parseHash', () => {
  it('parses a fragment with or without #', () => {
    expect(parseHash('#example=allOf-perf&tab=1')).toEqual({
      example: 'allOf-perf',
      tab: '1',
    })
    expect(parseHash('example=object')).toEqual({ example: 'object' })
  })

  it('returns an empty object for an empty hash', () => {
    expect(parseHash('')).toEqual({})
    expect(parseHash('#')).toEqual({})
  })

  it('decodes URL-encoded values', () => {
    expect(parseHash('#q=hello%20world')).toEqual({ q: 'hello world' })
  })
})

describe('stringifyHash', () => {
  it('serializes to a #key=value fragment', () => {
    expect(stringifyHash({ example: 'object', tab: '2' })).toBe('#example=object&tab=2')
  })

  it('omits undefined / null keys via shake', () => {
    expect(stringifyHash({ example: 'object', tab: undefined })).toBe('#example=object')
    expect(stringifyHash({ example: undefined })).toBe('')
  })

  it('returns an empty string with no parameters', () => {
    expect(stringifyHash({})).toBe('')
  })
})

describe('parseHash ↔ stringifyHash', () => {
  it('round-trips playground keys', () => {
    const original = { example: 'allOf-perf', tab: 'entries' }
    expect(parseHash(stringifyHash(original))).toEqual(original)
  })

  it('round-trips after omitting empties', () => {
    expect(parseHash(stringifyHash({ a: '1', b: undefined }))).toEqual({ a: '1' })
  })
})
