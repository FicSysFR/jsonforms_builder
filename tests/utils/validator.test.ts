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

  it('accepte toujours une chaîne password, même vide', () => {
    const ajv = createAjv()
    expect(ajv.validate({ type: 'string', format: 'password' }, '')).toBe(true)
  })

  it('conserve les formats JSON Schema standards', () => {
    const ajv = createAjv()

    expect(ajv.validate({ type: 'string', format: 'email' }, 'a@b.co')).toBe(true)
    expect(ajv.validate({ type: 'string', format: 'email' }, 'pas-un-email')).toBe(false)
  })

  it('transmet les options AJV', () => {
    const ajv = createAjv({ allErrors: true })
    ajv.validate({ type: 'object', required: ['a', 'b'], properties: {} }, {})

    expect(ajv.errors?.length).toBeGreaterThan(1)
  })
})
