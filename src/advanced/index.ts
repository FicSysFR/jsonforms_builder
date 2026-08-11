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

// `rendererEntry` pairs the entry with the component's default export — see its doc:
// without that reference the compiled template is tree-shaken out of production builds.
export const advancedRenderers = [
  rendererEntry(wysiwygControlRendererEntry, WysiwygControlRenderer),
]
