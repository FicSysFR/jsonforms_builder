import { describe, expect, it } from 'bun:test'
import {
  isArrayAtCapacity,
  isArrayAtMinimum,
  resolveArrayItemLabel,
} from '../../src/composables/useArrayControl'

describe('resolveArrayItemLabel', () => {
  it('falls back to a 1-based positional label', () => {
    expect(resolveArrayItemLabel({}, 0)).toBe('Élément 1')
    expect(resolveArrayItemLabel({}, 4)).toBe('Élément 5')
  })

  it('uses the configured property when it holds a value', () => {
    const item = { company: 'AMOT Ferroviaire', count: 6 }

    expect(resolveArrayItemLabel(item, 0, 'company')).toBe('AMOT Ferroviaire')
  })

  it('stringifies non-string label values', () => {
    expect(resolveArrayItemLabel({ count: 42 }, 0, 'count')).toBe('42')
  })

  it('falls back when the property is missing or empty', () => {
    expect(resolveArrayItemLabel({ company: '' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ other: 'x' }, 1, 'company')).toBe('Élément 2')
    expect(resolveArrayItemLabel({ company: null }, 1, 'company')).toBe('Élément 2')
  })

  it('falls back for primitive items even when a label prop is configured', () => {
    expect(resolveArrayItemLabel('etd', 0, 'company')).toBe('Élément 1')
  })
})

describe('isArrayAtCapacity', () => {
  it('is false when the schema sets no maxItems', () => {
    expect(isArrayAtCapacity(99, undefined)).toBe(false)
  })

  it('blocks once the length reaches maxItems', () => {
    expect(isArrayAtCapacity(2, 3)).toBe(false)
    expect(isArrayAtCapacity(3, 3)).toBe(true)
    expect(isArrayAtCapacity(4, 3)).toBe(true)
  })

  it('treats maxItems of 0 as a hard block', () => {
    expect(isArrayAtCapacity(0, 0)).toBe(true)
  })
})

describe('isArrayAtMinimum', () => {
  it('is false when the schema sets no minItems', () => {
    expect(isArrayAtMinimum(0, undefined)).toBe(false)
  })

  it('blocks removal once the length reaches minItems', () => {
    expect(isArrayAtMinimum(3, 2)).toBe(false)
    expect(isArrayAtMinimum(2, 2)).toBe(true)
    expect(isArrayAtMinimum(1, 2)).toBe(true)
  })
})
