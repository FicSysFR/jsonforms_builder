import { Generate, resolveSchema, type JsonSchema, type UISchemaElement } from '@jsonforms/core'
import type { useJsonFormsAllOfControl } from '@jsonforms/vue'
import { computed } from 'vue'
import { useUiControl } from '../utils'
import { hasRenderableControl } from './useObjectControl'

type JsonFormsAllOfControl = ReturnType<typeof useJsonFormsAllOfControl>

type UseAllOfControlOptions = {
  jsonFormsControl: JsonFormsAllOfControl
}

/**
 * Fusionne récursivement les branches `allOf` (et les `$ref`) en un schéma plat
 * exploitable par `Generate.uiSchema`.
 *
 * Un `allOf` peut lui-même renvoyer vers un autre `allOf` (ex. `person` → `subject` →
 * `conclusion` dans GEDCOM X). Une fusion à un seul niveau perdait alors toutes les
 * propriétés des branches imbriquées.
 *
 * Le résultat ne sert qu'à **générer la disposition** : le dispatcher reçoit toujours le
 * schéma d'origine (référence stable), pour que `Resolve` retrouve les propriétés via
 * le repli sur `allOf` et que le `watch(() => props.schema)` de JSON Forms ne reboucle pas.
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
      // Renvoi cassé : on garde la forme d'origine plutôt que de faire échouer le rendu.
    }
  }

  if (!current || typeof current !== 'object') {
    return { type: 'object', properties: {}, required: [] }
  }

  // Cycle de `$ref` / allOf : on s'arrête pour ne pas empiler la pile d'appels.
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
   * Disposition des branches fusionnées.
   *
   * On mémorise sur l'identité de `schema` / `rootSchema` : le wrapper `control` est
   * invalidé à chaque erreur ou donnée, mais ces deux références restent stables. Sans
   * ce cache, `Generate.uiSchema` produirait un nouvel arbre à chaque tick et forcerait
   * un remount inutile des enfants — le schéma passé au dispatcher, lui, doit rester
   * l'original (voir le template).
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
