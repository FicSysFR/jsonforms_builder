import { describe, expect, it } from 'vitest'
import { resolveControlIcons } from '../../src/utils/composition'

describe('resolveControlIcons', () => {
  it('defaults to outside placement without icons', () => {
    expect(resolveControlIcons()).toEqual({
      leadingIcon: undefined,
      trailingIcon: undefined,
      iconPlacement: 'outside',
    })
  })

  it('reads leading and trailing icon names', () => {
    expect(
      resolveControlIcons({
        leadingIcon: 'i-lucide-mail',
        trailingIcon: 'i-lucide-check',
      }),
    ).toEqual({
      leadingIcon: 'i-lucide-mail',
      trailingIcon: 'i-lucide-check',
      iconPlacement: 'outside',
    })
  })

  it('treats empty strings as absent', () => {
    expect(
      resolveControlIcons({
        leadingIcon: '',
        trailingIcon: '',
      }),
    ).toEqual({
      leadingIcon: undefined,
      trailingIcon: undefined,
      iconPlacement: 'outside',
    })
  })

  it('accepts inside placement', () => {
    expect(
      resolveControlIcons({
        leadingIcon: 'i-lucide-user',
        iconPlacement: 'inside',
      }),
    ).toEqual({
      leadingIcon: 'i-lucide-user',
      trailingIcon: undefined,
      iconPlacement: 'inside',
    })
  })

  it('ignores unknown placement values', () => {
    expect(resolveControlIcons({ iconPlacement: 'beside' }).iconPlacement).toBe('outside')
  })
})
