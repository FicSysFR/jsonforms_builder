import { describe, expect, it } from 'vitest'
import type { JsonSchema } from '@jsonforms/core'
import { resolveControlKind } from '../../src/builder/controlKind'

describe('resolveControlKind', () => {
  it('detects option-driven renderers first', () => {
    expect(resolveControlKind({ type: 'string' }, { multi: true })).toBe('textarea')
    expect(resolveControlKind({ type: 'integer' }, { slider: true })).toBe('slider')
    expect(resolveControlKind({ type: 'string' }, { format: 'pin' })).toBe('pin')
    expect(resolveControlKind({ type: 'integer' }, { format: 'rating' })).toBe('rating')
    expect(
      resolveControlKind({ type: 'array', items: { type: 'string' } }, { format: 'tags' }),
    ).toBe('tags')
    expect(resolveControlKind({ type: 'string', format: 'date' }, { format: 'calendar' })).toBe(
      'calendar',
    )
    expect(resolveControlKind({ type: 'object' }, { wysiwyg: true })).toBe('wysiwyg')
  })

  it('detects schema formats', () => {
    expect(resolveControlKind({ type: 'string', format: 'password' })).toBe('password')
    expect(resolveControlKind({ type: 'string', format: 'color' })).toBe('color')
    expect(resolveControlKind({ type: 'string', format: 'data-url' })).toBe('file')
    expect(resolveControlKind({ type: 'string', format: 'date' })).toBe('date')
    expect(resolveControlKind({ type: 'string', format: 'date-time' })).toBe('datetime')
    expect(resolveControlKind({ type: 'string', format: 'time' })).toBe('time')
  })

  it('detects enum variants', () => {
    const schema: JsonSchema = { type: 'string', enum: ['a', 'b'] }
    expect(resolveControlKind(schema)).toBe('enum')
    expect(resolveControlKind(schema, { format: 'radio' })).toBe('radio')
    expect(resolveControlKind(schema, { format: 'select' })).toBe('select')
  })

  it('detects arrays', () => {
    expect(
      resolveControlKind({
        type: 'array',
        items: { type: 'string', enum: ['a', 'b'] },
      }),
    ).toBe('multi-enum')
    expect(
      resolveControlKind({
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      }),
    ).toBe('array')
    expect(resolveControlKind({ type: 'array', items: { type: 'string' } })).toBe('tags')
    expect(resolveControlKind(undefined, {}, 'ListWithDetail')).toBe('array')
  })

  it('falls back to primitive types', () => {
    expect(resolveControlKind({ type: 'boolean' })).toBe('boolean')
    expect(resolveControlKind({ type: 'number' })).toBe('number')
    expect(resolveControlKind({ type: 'string' })).toBe('string')
    expect(resolveControlKind({ type: 'object' })).toBe('object')
    expect(resolveControlKind(undefined)).toBe('unknown')
  })
})
