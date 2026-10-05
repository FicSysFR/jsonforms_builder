import { rendererEntry } from '../rendererEntry'

import WysiwygControlRenderer, { entry as wysiwygControlRendererEntry } from './wysiwyg.vue'

export { WysiwygControlRenderer }
export { DEFAULT_TOOLBAR } from './wysiwygToolbar'
export {
  resolveWysiwygOptions,
  DEFAULT_IMAGE_RESIZE,
  type WysiwygOptions,
  type WysiwygContentType,
  type WysiwygDensity,
  type WysiwygImageOptions,
  type WysiwygImageResizeOptions,
  type WysiwygHandlers,
  type ResolvedWysiwygOptions,
} from './wysiwygOptions'
export * from './wysiwyg/ai'
export {
  DEFAULT_WYSIWYG_FEATURES,
  resolveWysiwygFeatures,
  type ResolvedWysiwygFeatures,
  type WysiwygFeatures,
} from './wysiwyg/features'
export { buildWysiwygFeatureExtensions } from './wysiwyg/extensions'
export { WYSIWYG_HIGHLIGHT_COLORS, WYSIWYG_TEXT_COLORS, type WysiwygColor } from './wysiwyg/colors'
export {
  WysiwygSearch,
  findWysiwygTextRanges,
  getWysiwygSearchState,
  type WysiwygSearchState,
  type WysiwygTextRange,
} from './wysiwyg/search'
export {
  WYSIWYG_TABLE_BUBBLE,
  buildWysiwygTextBubble,
  buildWysiwygToolbar,
} from './wysiwyg/toolbar'
export { WYSIWYG_SLASH_FILTER_FIELDS, buildWysiwygSlashItems } from './wysiwyg/slash/commands'
export {
  WYSIWYG_TABLE_ACTIONS,
  createWysiwygHandlers,
  type WysiwygEditorHandler,
  type WysiwygTableAction,
  type WysiwygUiState,
} from './wysiwyg/handlers'

// `rendererEntry` pairs the entry with the component's default export — see its doc:
// without that reference the compiled template is tree-shaken out of production builds.
export const advancedRenderers = [
  rendererEntry(wysiwygControlRendererEntry, WysiwygControlRenderer),
]
