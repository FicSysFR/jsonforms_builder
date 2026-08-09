import { describe, expect, it } from 'vitest'
import { resolveReturnLocation } from '../../playground/returnUrl'

describe('resolveReturnLocation', () => {
  it('falls back to gallery root when missing or unsafe', () => {
    expect(resolveReturnLocation(undefined)).toBe('/')
    expect(resolveReturnLocation('')).toBe('/')
    expect(resolveReturnLocation('https://evil.example/')).toBe('/')
    expect(resolveReturnLocation('//evil.example')).toBe('/')
    expect(resolveReturnLocation('gallery')).toBe('/')
  })

  it('rejects a return that points back at the builder', () => {
    expect(resolveReturnLocation('/builder')).toBe('/')
    expect(resolveReturnLocation('/builder?x=1')).toBe('/')
    expect(resolveReturnLocation('/builder/extra')).toBe('/')
  })

  it('keeps same-app relative locations', () => {
    expect(resolveReturnLocation('/')).toBe('/')
    expect(resolveReturnLocation('/?section=docs&example=login')).toBe(
      '/?section=docs&example=login',
    )
  })
})
