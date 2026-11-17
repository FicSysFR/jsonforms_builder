import { additionalsRenderers } from './additional'
import {
  AllOfControlRenderer,
  controlsRenderers,
  FileUploadControlRenderer,
  OneOfControlRenderer,
} from './controls'
import { layoutsRenderers } from './layouts'
import { advancedRenderers } from './advanced'

export { advancedRenderers }

/**
 * Default renderer set: controls, layouts, and additional elements.
 */
export const nuxtUiRenderers = [...controlsRenderers, ...layoutsRenderers, ...additionalsRenderers]

/**
 * Renderers that need a looser CSP than `script-src 'self'; img-src 'self'`:
 * - `oneOf` / `anyOf` and `allOf`: JSON Forms picks the matching variant by compiling every
 *   subschema with Ajv on each render, whatever the validation mode (`new Function`, so
 *   `'unsafe-eval'`);
 * - file upload: previews are `data:` URLs (`img-src data:`).
 */
const STRICT_CSP_EXCLUDED: ReadonlySet<unknown> = new Set([
  OneOfControlRenderer,
  AllOfControlRenderer,
  FileUploadControlRenderer,
])

/**
 * `nuxtUiRenderers` that render under a strict CSP: no `'unsafe-eval'`, no `'unsafe-inline'`,
 * no `data:` (verified by `tests/browser`). Pair it with `validation-mode="NoValidation"`, since
 * Ajv validation compiles code, and pass server errors through `additional-errors`.
 */
export const strictCspRenderers = nuxtUiRenderers.filter(
  (entry) => !STRICT_CSP_EXCLUDED.has(entry.renderer),
)

/**
 * Adds the advanced renderers (rich text editor). Separated from `nuxtUiRenderers` so that
 * forms without rich text do not pull in Tiptap.
 */
export const allRenderers = [...nuxtUiRenderers, ...advancedRenderers]
