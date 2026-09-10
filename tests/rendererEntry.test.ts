import { describe, expect, it, vi } from 'vitest'
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { rendererEntry } from '../src/rendererEntry'

describe('rendererEntry', () => {
  it('rebinds the compiled renderer without mutating registry metadata', () => {
    const originalRenderer = { name: 'setup-only' }
    const compiledRenderer = { name: 'compiled-with-template' }
    const tester = vi.fn(() => 5)
    const entry = { tester, renderer: originalRenderer } as JsonFormsRendererRegistryEntry

    const rebound = rendererEntry(entry, compiledRenderer)

    expect(rebound).toEqual({ tester, renderer: compiledRenderer })
    expect(rebound).not.toBe(entry)
    expect(entry.renderer).toBe(originalRenderer)
  })
})
