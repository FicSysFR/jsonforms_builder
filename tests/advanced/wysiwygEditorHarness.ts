import { Editor, type AnyExtension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

/** Real Tiptap editor mounted in jsdom (callers must opt into `@vitest-environment jsdom`). */
export const createTestEditor = (content: string, extensions: AnyExtension[] = []) => {
  const element = document.createElement('div')
  document.body.appendChild(element)
  return new Editor({ element, extensions: [StarterKit, ...extensions], content })
}

/** Document position of the first occurrence of `text` (start of the match). */
export const posOf = (editor: Editor, text: string): number => {
  let found = -1
  editor.state.doc.descendants((node, pos) => {
    if (found >= 0) return false
    if (node.isText && node.text) {
      const index = node.text.indexOf(text)
      if (index >= 0) found = pos + index
    }
    return true
  })
  if (found < 0) throw new Error(`"${text}" not found`)
  return found
}

export const selectText = (editor: Editor, text: string) => {
  const from = posOf(editor, text)
  editor.commands.setTextSelection({ from, to: from + text.length })
}
