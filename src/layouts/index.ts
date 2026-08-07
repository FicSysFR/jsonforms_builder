export { default as VerticalAndHorizontalLayoutRenderer } from './vertical-and-horizontal.vue'
export { default as CategorizationLayoutRenderer } from './categorization.vue'
export { default as GroupLayoutRenderer } from './group.vue'

import { entry as verticalAndHorizontalRendererEntry } from './vertical-and-horizontal.vue'
import { entry as categorizationRendererEntry } from './categorization.vue'
import { entry as groupRendererEntry } from './group.vue'

export const layoutsRenderers = [
  verticalAndHorizontalRendererEntry,
  categorizationRendererEntry,
  groupRendererEntry,
]
