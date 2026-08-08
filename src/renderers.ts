import { additionalsRenderers } from './additional'
import { controlsRenderers } from './controls'
import { layoutsRenderers } from './layouts'
import { advancedRenderers } from './advanced'

export { advancedRenderers }

/**
 * Default renderer set: controls, layouts, and additional elements.
 */
export const nuxtUiRenderers = [...controlsRenderers, ...layoutsRenderers, ...additionalsRenderers]

/**
 * Adds the advanced renderers (rich text editor). Separated from `nuxtUiRenderers` so that
 * forms without rich text do not pull in Tiptap.
 */
export const allRenderers = [...nuxtUiRenderers, ...advancedRenderers]
