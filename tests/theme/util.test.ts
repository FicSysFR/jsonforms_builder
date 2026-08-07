import { describe, expect, it } from 'bun:test'
import { classes, mergeStyles } from '../../src/styles/util'

describe('classes', () => {
  it('concatenates template literal segments with variables', () => {
    const result = classes`btn ${'btn--primary'} ${false && 'hidden'}`

    expect(result).toBe('btn btn--primary')
  })
})

describe('mergeStyles', () => {
  it('merges and concatenates class strings deeply', () => {
    const base = {
      control: {
        root: 'control-base',
        label: 'label-base',
      },
    }

    const override = {
      control: {
        root: 'control-override',
        input: 'input-override',
      },
    }

    const merged = mergeStyles(base, override)

    expect(merged.control?.root).toBe('control-base control-override')
    expect(merged.control?.label).toBe('label-base')
    expect(merged.control?.input).toBe('input-override')
    expect(base.control?.input).toBeUndefined()
  })
})
