import { describe, expect, it } from 'vitest'
import { FormImportError, parseFormImport } from '../../src/builder/importForm'

describe('parseFormImport', () => {
  it('accepts { schema, uischema }', () => {
    const result = parseFormImport(
      JSON.stringify({
        schema: { type: 'object', properties: { name: { type: 'string' } } },
        uischema: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
        data: { name: 'ignored' },
      }),
    )

    expect(result.schema.properties).toHaveProperty('name')
    expect(result.uischema).toMatchObject({ type: 'VerticalLayout' })
  })

  it('generates a uischema when only schema is provided', () => {
    const result = parseFormImport(
      JSON.stringify({
        schema: {
          type: 'object',
          properties: {
            age: { type: 'integer', title: 'Âge' },
          },
        },
      }),
    )

    expect(result.schema.properties).toHaveProperty('age')
    expect(result.uischema.type).toBe('VerticalLayout')
    expect(JSON.stringify(result.uischema)).toContain('#/properties/age')
  })

  it('accepts a bare JSON Schema', () => {
    const result = parseFormImport(
      JSON.stringify({
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      }),
    )

    expect(result.schema.properties).toHaveProperty('email')
    expect(result.uischema.type).toBe('VerticalLayout')
  })

  it('rejects empty input', () => {
    expect(() => parseFormImport('   ')).toThrow(FormImportError)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseFormImport('{')).toThrow(/invalide/i)
  })

  it('rejects a lone UI Schema', () => {
    expect(() =>
      parseFormImport(
        JSON.stringify({
          type: 'VerticalLayout',
          elements: [],
        }),
      ),
    ).toThrow(/UI Schema/i)
  })
})
