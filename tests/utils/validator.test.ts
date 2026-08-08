import { describe, expect, it } from 'vitest'
import { createAjv } from '../../src/utils/validator'

describe('createAjv', () => {
  it('adds a permissive password format', () => {
    const ajv = createAjv()

    const schema = {
      type: 'string',
      format: 'password',
    } as const

    expect(ajv.validate(schema, 'any-password')).toBe(true)
    expect(ajv.validate(schema, 12345)).toBe(false)
  })
})
