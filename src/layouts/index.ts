import { rendererEntry } from '../rendererEntry'

import VerticalAndHorizontalLayoutRenderer, {
  entry as verticalAndHorizontalRendererEntry,
} from './vertical-and-horizontal.vue'
import CategorizationLayoutRenderer, {
  entry as categorizationRendererEntry,
} from './categorization.vue'
import GroupLayoutRenderer, { entry as groupRendererEntry } from './group.vue'
import ListWithDetailRenderer, {
  entry as listWithDetailRendererEntry,
} from './list-with-detail.vue'

export {
  VerticalAndHorizontalLayoutRenderer,
  CategorizationLayoutRenderer,
  GroupLayoutRenderer,
  ListWithDetailRenderer,
}

// `rendererEntry` pairs each entry with the component's default export — see its doc:
// without that reference the compiled templates are tree-shaken out of production builds.
export const layoutsRenderers = [
  rendererEntry(verticalAndHorizontalRendererEntry, VerticalAndHorizontalLayoutRenderer),
  rendererEntry(categorizationRendererEntry, CategorizationLayoutRenderer),
  rendererEntry(groupRendererEntry, GroupLayoutRenderer),
  rendererEntry(listWithDetailRendererEntry, ListWithDetailRenderer),
]
