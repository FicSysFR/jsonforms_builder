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

  it('always accepts a password string, even empty', () => {
    const ajv = createAjv()
    expect(ajv.validate({ type: 'string', format: 'password' }, '')).toBe(true)
  })

  it('keeps standard JSON Schema formats', () => {
    const ajv = createAjv()

    expect(ajv.validate({ type: 'string', format: 'email' }, 'a@b.co')).toBe(true)
    expect(ajv.validate({ type: 'string', format: 'email' }, 'not-an-email')).toBe(false)
  })

  it('forwards AJV options', () => {
    const ajv = createAjv({ allErrors: true })
    ajv.validate({ type: 'object', required: ['a', 'b'], properties: {} }, {})

    expect(ajv.errors?.length).toBeGreaterThan(1)
  })
})
