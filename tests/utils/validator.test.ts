import { describe, expect, it } from 'vitest'
import { createAjv } from '../../src/utils/validator'

describe('createAjv', () => {
  it.each(['password', 'color', 'data-url'] as const)(
    'adds a permissive %s format',
    (format) => {
      const ajv = createAjv()
      const schema = { type: 'string', format } as const

      expect(ajv.validate(schema, 'any-value')).toBe(true)
      expect(ajv.validate(schema, 12345)).toBe(false)
      expect(ajv.validate(schema, '')).toBe(true)
    },
  )

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
