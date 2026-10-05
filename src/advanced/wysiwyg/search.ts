import { Extension, type Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export type WysiwygTextRange = { from: number; to: number }

export type WysiwygSearchState = {
  term: string
  caseSensitive: boolean
  results: WysiwygTextRange[]
  /** Index of the current match in `results` (`-1` when there is none). */
  current: number
}

type SearchMeta = Partial<Pick<WysiwygSearchState, 'term' | 'caseSensitive' | 'current'>>

/** Inline leaves (hard breaks, mentions…) count as one character so offsets stay 1:1. */
const LEAF_PLACEHOLDER = '￼'

/**
 * Finds `term` inside each text block, across mark boundaries. Positions are document
 * positions usable as a ProseMirror range.
 */
export const findWysiwygTextRanges = (
  doc: ProseMirrorNode,
  term: string,
  caseSensitive = false,
): WysiwygTextRange[] => {
  if (!term) return []
  const needle = caseSensitive ? term : term.toLocaleLowerCase()
  const ranges: WysiwygTextRange[] = []

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    const start = pos + 1
    const raw = doc.textBetween(start, start + node.content.size, undefined, LEAF_PLACEHOLDER)
    const haystack = caseSensitive ? raw : raw.toLocaleLowerCase()
    // `toLocaleLowerCase` can change length for a few scripts: fall back to exact case.
    const source = haystack.length === raw.length ? haystack : raw
    const query = haystack.length === raw.length ? needle : term
    let index = source.indexOf(query)
    while (index >= 0) {
      ranges.push({ from: start + index, to: start + index + query.length })
      index = source.indexOf(query, index + Math.max(query.length, 1))
    }
    return false
  })

  return ranges
}

export const wysiwygSearchKey = new PluginKey<WysiwygSearchState>('wysiwygSearch')

const EMPTY_STATE: WysiwygSearchState = { term: '', caseSensitive: false, results: [], current: -1 }

const recompute = (doc: ProseMirrorNode, state: WysiwygSearchState): WysiwygSearchState => {
  const results = findWysiwygTextRanges(doc, state.term, state.caseSensitive)
  const current = results.length ? Math.min(Math.max(state.current, 0), results.length - 1) : -1
  return { ...state, results, current }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wysiwygSearch: {
      setSearchTerm: (term: string) => ReturnType
      setSearchCaseSensitive: (caseSensitive: boolean) => ReturnType
      nextSearchResult: () => ReturnType
      previousSearchResult: () => ReturnType
      replaceSearchResult: (replacement: string) => ReturnType
      replaceAllSearchResults: (replacement: string) => ReturnType
    }
  }
}

/** Current search state of an editor (empty when the extension is not installed). */
export const getWysiwygSearchState = (state: EditorState): WysiwygSearchState =>
  wysiwygSearchKey.getState(state) ?? EMPTY_STATE

/**
 * Find & replace: highlights matches with decorations (never stored in the document)
 * and exposes navigation / replace commands, each replace being one undo step.
 */
export const WysiwygSearch = Extension.create({
  name: 'wysiwygSearch',

  addCommands() {
    const update =
      (meta: SearchMeta) =>
      ({ tr, dispatch }: { tr: Transaction; dispatch?: (tr: Transaction) => void }) => {
        if (dispatch) dispatch(tr.setMeta(wysiwygSearchKey, meta))
        return true
      }

    const step =
      (direction: 1 | -1) =>
      ({
        state,
        tr,
        dispatch,
      }: {
        state: EditorState
        tr: Transaction
        dispatch?: (tr: Transaction) => void
      }) => {
        const search = getWysiwygSearchState(state)
        if (!search.results.length) return false
        const total = search.results.length
        const current = (search.current + direction + total) % total
        if (dispatch) dispatch(tr.setMeta(wysiwygSearchKey, { current }))
        return true
      }

    return {
      setSearchTerm: (term: string) => update({ term, current: 0 }),
      setSearchCaseSensitive: (caseSensitive: boolean) => update({ caseSensitive, current: 0 }),
      nextSearchResult: () => step(1),
      previousSearchResult: () => step(-1),
      replaceSearchResult:
        (replacement: string) =>
        ({ state, tr, dispatch }) => {
          const search = getWysiwygSearchState(state)
          const range = search.results[search.current]
          if (!range) return false
          if (dispatch) {
            if (replacement) tr.insertText(replacement, range.from, range.to)
            else tr.delete(range.from, range.to)
            dispatch(tr)
          }
          return true
        },
      replaceAllSearchResults:
        (replacement: string) =>
        ({ state, tr, dispatch }) => {
          const { results } = getWysiwygSearchState(state)
          if (!results.length) return false
          if (dispatch) {
            for (const range of [...results].reverse()) {
              if (replacement) tr.insertText(replacement, range.from, range.to)
              else tr.delete(range.from, range.to)
            }
            dispatch(tr)
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<WysiwygSearchState>({
        key: wysiwygSearchKey,
        state: {
          init: () => EMPTY_STATE,
          apply(tr, value, _old, next) {
            const meta = tr.getMeta(wysiwygSearchKey) as SearchMeta | undefined
            if (meta) return recompute(next.doc, { ...value, ...meta })
            return tr.docChanged && value.term ? recompute(next.doc, value) : value
          },
        },
        props: {
          decorations(state) {
            const search = wysiwygSearchKey.getState(state)
            if (!search?.results.length) return DecorationSet.empty
            return DecorationSet.create(
              state.doc,
              search.results.map((range, index) =>
                Decoration.inline(range.from, range.to, {
                  class:
                    index === search.current
                      ? 'jf-wysiwyg-search-match jf-wysiwyg-search-match-current'
                      : 'jf-wysiwyg-search-match',
                }),
              ),
            )
          },
        },
      }),
    ]
  },
})

/** Scrolls the current match into view (DOM side effect kept out of the plugin). */
export const scrollToCurrentSearchResult = (editor: Editor) => {
  const { results, current } = getWysiwygSearchState(editor.state)
  const range = results[current]
  if (!range || editor.isDestroyed) return
  try {
    const { node } = editor.view.domAtPos(range.from)
    const element = node instanceof Element ? node : node.parentElement
    element?.scrollIntoView?.({ block: 'nearest' })
  } catch {
    // Position not rendered (e.g. editor hidden): nothing to scroll.
  }
}
