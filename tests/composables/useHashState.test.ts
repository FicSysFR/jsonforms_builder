import { describe, expect, it } from 'vitest'
import { parseHash, stringifyHash } from '../../src/composables/useHashState'

describe('parseHash', () => {
  it('parse un fragment avec ou sans #', () => {
    expect(parseHash('#example=allOf-perf&tab=1')).toEqual({
      example: 'allOf-perf',
      tab: '1',
    })
    expect(parseHash('example=object')).toEqual({ example: 'object' })
  })

  it('retourne un objet vide pour un hash vide', () => {
    expect(parseHash('')).toEqual({})
    expect(parseHash('#')).toEqual({})
  })

  it('décode les valeurs URL-encodées', () => {
    expect(parseHash('#q=hello%20world')).toEqual({ q: 'hello world' })
  })
})

describe('stringifyHash', () => {
  it('sérialise en fragment #key=value', () => {
    expect(stringifyHash({ example: 'object', tab: '2' })).toBe('#example=object&tab=2')
  })

  it('omet les clés undefined / null via shake', () => {
    expect(stringifyHash({ example: 'object', tab: undefined })).toBe('#example=object')
    expect(stringifyHash({ example: undefined })).toBe('')
  })

  it('retourne une chaîne vide sans paramètres', () => {
    expect(stringifyHash({})).toBe('')
  })
})

describe('parseHash ↔ stringifyHash', () => {
  it('round-trip pour les clés playground', () => {
    const original = { example: 'allOf-perf', tab: 'entries' }
    expect(parseHash(stringifyHash(original))).toEqual(original)
  })

  it('round-trip après omission des vides', () => {
    expect(parseHash(stringifyHash({ a: '1', b: undefined }))).toEqual({ a: '1' })
  })
})
