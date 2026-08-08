import { Generate, resolveSchema, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import type { useJsonFormsControl } from '@jsonforms/vue'
import { computed } from 'vue'
import { useUiControl } from '../utils'
import { hasRenderableControl } from './useObjectControl'

type JsonFormsControl = ReturnType<typeof useJsonFormsControl>

type UseAllOfControlOptions = {
  jsonFormsControl: JsonFormsControl
}

/**
 * Recursively flattens `allOf` branches (and `$ref`s) into a flat schema
 * usable by `Generate.uiSchema`.
 *
 * An `allOf` may itself point to another `allOf` (e.g. `person` → `subject` →
 * `conclusion` in GEDCOM X). A single-level merge would then lose all
 * properties from nested branches.
 *
 * The result is used only to **generate the layout**: the dispatcher always receives the
 * original schema (stable reference), so that `Resolve` finds properties via
 * the `allOf` fallback and JSON Forms' `watch(() => props.schema)` does not loop.
 */
export const flattenAllOfSchema = (
  schema: JsonSchema | undefined,
  rootSchema: JsonSchema,
  seen: Set<JsonSchema> = new Set(),
): JsonSchema => {
  let current = schema

  if (current?.$ref) {
    try {
      current = resolveSchema(rootSchema, current.$ref, rootSchema) ?? current
    } catch {
      // Broken reference: keep the original shape rather than failing the render.
    }
  }

  if (!current || typeof current !== 'object') {
    return { type: 'object', properties: {}, required: [] }
  }

  // `$ref` / allOf cycle: stop so we do not blow the call stack.
  if (seen.has(current)) {
    return { type: 'object', properties: {}, required: [] }
  }

  seen.add(current)

  const merged: JsonSchema & {
    type: 'object'
    properties: Record<string, JsonSchema>
    required: string[]
  } = {
    type: 'object',
    properties: { ...(current.properties ?? {}) },
    required: [...(current.required ?? [])],
  }

  for (const branch of current.allOf ?? []) {
    const nested = flattenAllOfSchema(branch, rootSchema, seen)
    Object.assign(merged.properties, nested.properties ?? {})
    merged.required.push(...(nested.required ?? []))
  }

  merged.required = [...new Set(merged.required)]

  return merged
}

export const useAllOfControl = ({ jsonFormsControl }: UseAllOfControlOptions) => {
  const control = useUiControl(jsonFormsControl)

  /**
   * Layout for the merged branches.
   *
   * We memoize on the identity of `schema` / `rootSchema`: the `control` wrapper is
   * invalidated on every error or data change, but those two references stay stable. Without
   * this cache, `Generate.uiSchema` would produce a new tree every tick and force
   * an unnecessary remount of children — the schema passed to the dispatcher must remain
   * the original (see the template).
   */
  let cachedSchema: JsonSchema | undefined
  let cachedRoot: JsonSchema | undefined
  let cachedUiSchema: UISchemaElement | undefined

  const detailUiSchema = computed<UISchemaElement | undefined>(() => {
    const detail = control.control.value.uischema.options?.detail as UISchemaElement | undefined
    if (detail) {
      return detail
    }

    const schema = control.control.value.schema
    const rootSchema = control.control.value.rootSchema

    if (schema === cachedSchema && rootSchema === cachedRoot) {
      return cachedUiSchema
    }

    cachedSchema = schema
    cachedRoot = rootSchema

    const flattened = flattenAllOfSchema(schema, rootSchema)

    if (!Object.keys(flattened.properties ?? {}).length) {
      cachedUiSchema = undefined
      return cachedUiSchema
    }

    const generated = Generate.uiSchema(flattened, 'VerticalLayout', undefined, rootSchema)

    cachedUiSchema = hasRenderableControl(generated) ? generated : undefined
    return cachedUiSchema
  })

  return {
    ...control,
    detailUiSchema,
  }
}
