import { additionalsRenderers } from './additional'
import { controlsRenderers } from './controls'
import { layoutsRenderers } from './layouts'
import { advancedRenderers } from './advanced'

export { advancedRenderers }

/**
 * Jeu de renderers par défaut : contrôles, layouts et éléments additionnels.
 */
export const nuxtUiRenderers = [...controlsRenderers, ...layoutsRenderers, ...additionalsRenderers]

/**
 * Ajoute les renderers avancés (éditeur riche). Séparé de `nuxtUiRenderers` afin que
 * les formulaires sans texte riche n'embarquent pas Tiptap.
 */
export const allRenderers = [...nuxtUiRenderers, ...advancedRenderers]
