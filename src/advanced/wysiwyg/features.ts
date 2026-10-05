/**
 * Editor capabilities layered on top of `UEditor`'s StarterKit. Each feature registers
 * its Tiptap extension(s) and default toolbar entries; `false` removes both.
 */
export type WysiwygFeatures = {
  /** Task lists (`taskList` toolbar button). Default: `true`. */
  taskList?: boolean
  /** Paragraph / heading alignment (`textAlign` toolbar buttons). Default: `true`. */
  textAlign?: boolean
  /** Tables, insertion and the contextual table bubble. Default: `true`. */
  table?: boolean
  /** Text colors (`textStyle` + `color`). Default: `true`. */
  textColor?: boolean
  /** Multicolor highlights. Default: `true`. */
  highlight?: boolean
  /** Inline link editor replacing the browser `prompt()`. Default: `true`. */
  linkEditor?: boolean
  /** Find & replace panel. Default: `true`. */
  findReplace?: boolean
  /** Raw HTML / JSON source editing. Default: `true`. */
  sourceMode?: boolean
  /** Read-only preview toggle. Default: `true`. */
  preview?: boolean
}

export type ResolvedWysiwygFeatures = Required<WysiwygFeatures>

export const DEFAULT_WYSIWYG_FEATURES: Readonly<ResolvedWysiwygFeatures> = Object.freeze({
  taskList: true,
  textAlign: true,
  table: true,
  textColor: true,
  highlight: true,
  linkEditor: true,
  findReplace: true,
  sourceMode: true,
  preview: true,
})

/** `false` disables every feature; an object overrides individual defaults. */
export const resolveWysiwygFeatures = (raw: unknown): ResolvedWysiwygFeatures => {
  if (raw === false) {
    return Object.fromEntries(
      Object.keys(DEFAULT_WYSIWYG_FEATURES).map((key) => [key, false]),
    ) as ResolvedWysiwygFeatures
  }
  const resolved = { ...DEFAULT_WYSIWYG_FEATURES }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const key of Object.keys(resolved) as Array<keyof ResolvedWysiwygFeatures>) {
      const value = (raw as Record<string, unknown>)[key]
      if (typeof value === 'boolean') resolved[key] = value
    }
  }
  return resolved
}
