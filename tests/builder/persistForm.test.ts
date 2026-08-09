import { describe, expect, it } from 'vitest'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import {
  clearFormDraft,
  isMeaningfulDefinition,
  readFormDraft,
  writeFormDraft,
  type FormDraftStorage,
} from '../../src/builder/persistForm'

const memoryStorage = (): FormDraftStorage & { store: Map<string, string> } => {
  const store = new Map<string, string>()
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

describe('isMeaningfulDefinition', () => {
  it('rejects empty / undefined definitions', () => {
    expect(isMeaningfulDefinition(undefined)).toBe(false)
    expect(isMeaningfulDefinition({})).toBe(false)
    expect(
      isMeaningfulDefinition({
        schema: { type: 'object', properties: {} },
        uischema: { type: 'VerticalLayout', elements: [] } as UISchemaElement,
      }),
    ).toBe(false)
  })

  it('detects schema properties or layout elements', () => {
    expect(
      isMeaningfulDefinition({
        schema: { type: 'object', properties: { name: { type: 'string' } } },
      }),
    ).toBe(true)
    expect(
      isMeaningfulDefinition({
        uischema: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        } as UISchemaElement,
      }),
    ).toBe(true)
  })
})

describe('form draft storage', () => {
  const schema = { type: 'object', properties: { a: { type: 'string' } } } as JsonSchema
  const uischema = {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/a' }],
  } as UISchemaElement

  it('round-trips schema, uischema and data', () => {
    const storage = memoryStorage()

    writeFormDraft(storage, 'draft', { schema, uischema, data: { a: 'hi' } })

    expect(readFormDraft(storage, 'draft')).toEqual({
      schema,
      uischema,
      data: { a: 'hi' },
    })
  })

  it('returns undefined for missing or malformed entries', () => {
    const storage = memoryStorage()

    expect(readFormDraft(storage, 'missing')).toBeUndefined()

    storage.setItem('bad', '{')
    expect(readFormDraft(storage, 'bad')).toBeUndefined()

    storage.setItem('partial', JSON.stringify({ schema }))
    expect(readFormDraft(storage, 'partial')).toBeUndefined()
  })

  it('clears a stored draft', () => {
    const storage = memoryStorage()
    writeFormDraft(storage, 'draft', { schema, uischema })
    clearFormDraft(storage, 'draft')
    expect(readFormDraft(storage, 'draft')).toBeUndefined()
  })

  it('swallows write failures', () => {
    const storage: FormDraftStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => undefined,
    }

    expect(() => writeFormDraft(storage, 'draft', { schema, uischema })).not.toThrow()
  })
})
