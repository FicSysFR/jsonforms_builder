import { additionalsRenderers } from './additional'
import { controlsRenderers, FileUploadControlRenderer } from './controls'
import { layoutsRenderers } from './layouts'

/**
 * Default renderer set: controls, layouts, and additional elements.
 */
export const nuxtUiRenderers = [...controlsRenderers, ...layoutsRenderers, ...additionalsRenderers]

/**
 * Renderers that need a looser CSP than `img-src 'self'`: file upload previews images through
 * `blob:` URLs (`img-src blob:`). No renderer compiles code: `oneOf` / `anyOf` / `allOf` pick
 * their variant without Ajv.
 */
const STRICT_CSP_EXCLUDED: ReadonlySet<unknown> = new Set([FileUploadControlRenderer])

/**
 * `nuxtUiRenderers` that render under a strict CSP: no `'unsafe-eval'`, no `'unsafe-inline'`,
 * no `data:` or `blob:` (verified by `tests/browser`). Pair it with `validation-mode="NoValidation"`
 * and rules without `condition.schema`, since both make Ajv compile code, and pass server errors
 * through `additional-errors`.
 */
export const strictCspRenderers = nuxtUiRenderers.filter(
  (entry) => !STRICT_CSP_EXCLUDED.has(entry.renderer),
)
