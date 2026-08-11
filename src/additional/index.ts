import { rendererEntry } from '../rendererEntry'

import LabelAdditionalRenderer, { entry as labelAdditionalRendererEntry } from './label.vue'

export { LabelAdditionalRenderer }

// `rendererEntry` pairs the entry with the component's default export — see its doc:
// without that reference the compiled template is tree-shaken out of production builds.
export const additionalsRenderers = [
  rendererEntry(labelAdditionalRendererEntry, LabelAdditionalRenderer),
]
