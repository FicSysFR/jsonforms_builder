import { createDefaultValue, resolveSchema, type JsonSchema } from '@jsonforms/core'

/**
 * Branches of a `oneOf` / `anyOf`, with **`$ref`s resolved**.
 *
 * A branch written as `{ $ref: '#/definitions/address' }` describes nothing by itself.
 * Passing it as-is to the dispatcher would resolve a scope against a schema that is only a
 * reference, and `resolveSchema` then loops (`Maximum call stack size exceeded`). Resolution
 * therefore belongs to the renderer.
 *
 * An unresolvable branch is kept as-is rather than dropped: a poor variant beats a selector
 * missing an option the schema declares.
 */
export const resolveCombinatorBranches = (
  schema: JsonSchema | undefined,
  rootSchema: JsonSchema,
): JsonSchema[] => {
  const branches: JsonSchema[] = schema?.oneOf ?? schema?.anyOf ?? []

  return branches.map((branch) => {
    if (!branch?.$ref) {
      return branch
    }

    try {
      return resolveSchema(rootSchema, branch.$ref, rootSchema) ?? branch
    } catch {
      return branch
    }
  })
}

/**
 * Guesses which branch of a `oneOf` describes the current data.
 *
 * Deliberately simple heuristic: keep the first branch whose `required` properties are all
 * present and whose `const` values match when present. Enough for common discriminators
 * (`{ required: ['kind'], properties: { kind: { const: 'track' } } }`), without AJV
 * validation cost on every keystroke.
 *
 * @returns The branch index, or `-1` if none clearly matches.
 */
export const detectOneOfVariant = (data: unknown, variants: JsonSchema[]): number => {
  if (!data || typeof data !== 'object') {
    return -1
  }

  const record = data as Record<string, unknown>

  return variants.findIndex((variant) => {
    const required = variant.required ?? []

    if (!required.length) {
      return false
    }

    return required.every((key) => {
      if (record[key] === undefined) {
        return false
      }

      const constValue = variant.properties?.[key]?.const

      return constValue === undefined || record[key] === constValue
    })
  })
}

/**
 * Initial value for a branch, **discriminators included**.
 *
 * JSONForms' `createDefaultValue` ignores `const` values: without this supplement, switching
 * variants would produce an object that `detectOneOfVariant` could no longer attach to any
 * branch, and the selector would immediately fall back to the first.
 */
export const createVariantValue = (variant: JsonSchema, rootSchema: JsonSchema): unknown => {
  const value = createDefaultValue(variant, rootSchema) ?? {}

  if (!value || typeof value !== 'object') {
    return value
  }

  for (const [key, property] of Object.entries(variant.properties ?? {})) {
    const constValue = property?.const

    if (constValue !== undefined) {
      ;(value as Record<string, unknown>)[key] = constValue
    }
  }

  return value
}
