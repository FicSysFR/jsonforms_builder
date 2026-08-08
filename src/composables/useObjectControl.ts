import { computed } from 'vue'
import { Generate, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import type { useJsonFormsControl } from '@jsonforms/vue'
import { useUiControl } from '../utils'

type JsonFormsControl = ReturnType<typeof useJsonFormsControl>

type UseObjectControlOptions = {
  jsonFormsControl: JsonFormsControl
}

/**
 * Is this schema suitable for "object" rendering?
 *
 * Upstream `isObjectControl` returns true whenever `object` appears in `type` — including
 * in a **union** (`type: ['object', 'string', 'number', …]`). Yet on a union without
 * `properties`, there are no properties to expand: this renderer, ranked higher (rank 2)
 * than scalar renderers (rank 1), won dispatch only to show an empty card.
 *
 * We therefore decline that specific case, and the value falls back to a renderer that can
 * at least edit it. A plain `type: "object"` keeps control, even without `properties`:
 * it is still an object, and the renderer displays keys outside the schema.
 */
export const isRenderableObjectSchema = (schema: JsonSchema | undefined): boolean => {
  if (schema?.properties || schema?.patternProperties) {
    return true
  }

  const type = schema?.type

  return !Array.isArray(type) || type.every((entry) => entry === 'object')
}

/** A scope that refers to the current element rather than a property below it. */
const isSelfScope = (scope: unknown): boolean =>
  typeof scope !== 'string' || scope === '#' || scope === '#/'

/**
 * Does the generated layout contain at least one control to render?
 *
 * Without usable `properties`, `Generate.uiSchema` can only describe the object itself:
 * it produces either a `#`-scoped `Control`, or — the case we missed — a layout containing
 * only such a control. Redispatched, that control returns to the object renderer, which
 * regenerates the same layout: `Maximum call stack size exceeded`.
 *
 * We therefore reason about *the presence of a descendant control* rather than the shape of
 * the generated root: that is the only formulation that covers both cases, and future
 * ones (a layout nested inside another).
 */
export const hasRenderableControl = (element: unknown): boolean => {
  if (!element || typeof element !== 'object') {
    return false
  }

  const node = element as { type?: string; scope?: unknown; elements?: unknown }

  if (node.type === 'Control') {
    return !isSelfScope(node.scope)
  }

  return Array.isArray(node.elements) && node.elements.some(hasRenderableControl)
}

/** Keys present in the data but absent from the schema's `properties`. */
export const collectExtraProperties = (
  data: unknown,
  properties: JsonSchema['properties'],
): { key: string; value: string }[] => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return []
  }

  const known = Object.keys(properties ?? {})

  return Object.entries(data as Record<string, unknown>)
    .filter(([key]) => !known.includes(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
}

export const useObjectControl = ({ jsonFormsControl }: UseObjectControlOptions) => {
  const control = useUiControl(jsonFormsControl)

  /** `options.detail` takes precedence; otherwise we generate the layout from the schema. */
  const detailUiSchema = computed<UISchemaElement | undefined>(() => {
    const detail = control.control.value.uischema.options?.detail as UISchemaElement | undefined

    if (detail) {
      return detail
    }

    const generated = Generate.uiSchema(
      control.control.value.schema,
      'VerticalLayout',
      undefined,
      control.control.value.rootSchema,
    )

    return hasRenderableControl(generated) ? generated : undefined
  })

  const extraProperties = computed(() =>
    collectExtraProperties(control.control.value.data, control.control.value.schema?.properties),
  )

  return {
    ...control,
    detailUiSchema,
    extraProperties,
  }
}
