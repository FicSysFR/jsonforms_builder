import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core'

/**
 * Rebinds a registry entry onto the SFC's *default* export.
 *
 * `@vitejs/plugin-vue` does not put the compiled template inside the component
 * object: it emits a separate, `/*#__PURE__*\/`-annotated call that attaches it to the
 * **default** export (`export default _export_sfc(component, [['render', render]])`).
 *
 * Our renderers are consumed through the `entry` named export, so a bundle that only
 * reaches for `allRenderers` never references the default export. Rollup is then free
 * to drop that pure call — and it does, in any production build. The component keeps
 * its `setup()` but loses its template, JSON Forms mounts it, Vue renders a bare
 * comment node, and every form silently comes out empty (no error, no warning).
 *
 * `_export_sfc` mutates and returns the very object `entry.renderer` already points
 * at, so naming the default export here is enough to keep the call alive. It also
 * makes the dependency explicit: drop the default import and TypeScript complains.
 */
export const rendererEntry = (
  entry: JsonFormsRendererRegistryEntry,
  renderer: JsonFormsRendererRegistryEntry['renderer'],
): JsonFormsRendererRegistryEntry => ({ ...entry, renderer })
