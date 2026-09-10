import { describe, expect, it } from 'vitest'
import { DEFAULT_TOOLBAR } from '../../src/advanced/wysiwygToolbar'

type ToolbarItem = {
  kind: string
  'aria-label'?: string
  tooltip?: { text?: string }
}

describe('DEFAULT_TOOLBAR', () => {
  const items = DEFAULT_TOOLBAR.flat() as ToolbarItem[]

  it('keeps semantic command groups in their expected order', () => {
    expect(DEFAULT_TOOLBAR.map((group) => group.map((item) => item.kind))).toEqual([
      ['undo', 'redo'],
      ['heading', 'heading', 'heading', 'paragraph'],
      ['mark', 'mark', 'mark', 'mark', 'mark'],
      ['textAlign', 'textAlign', 'textAlign', 'textAlign'],
      ['bulletList', 'orderedList', 'taskList'],
      ['blockquote', 'codeBlock', 'horizontalRule'],
      ['link', 'imageUpload'],
      ['clearFormatting'],
    ])
  })

  it('gives every command an accessible name and a tooltip', () => {
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item['aria-label']?.trim())).toBe(true)
    expect(items.every((item) => item.tooltip?.text?.trim())).toBe(true)
  })

  it('contains no duplicate command identity within a group', () => {
    for (const group of DEFAULT_TOOLBAR) {
      const identities = group.map((item) => JSON.stringify(item))
      expect(new Set(identities).size).toBe(group.length)
    }
  })
})
