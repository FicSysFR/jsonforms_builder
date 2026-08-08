import { createDefaultValue, resolveSchema, type JsonSchema } from '@jsonforms/core'

/**
 * Branches d'un `oneOf` / `anyOf`, **`$ref` suivis**.
 *
 * Une branche écrite `{ $ref: '#/definitions/address' }` ne décrit rien par elle-même.
 * La transmettre telle quelle au dispatcher lui ferait résoudre un scope contre un
 * schéma qui n'est qu'un renvoi, et `resolveSchema` part alors en boucle
 * (`Maximum call stack size exceeded`). La résolution appartient donc au renderer.
 *
 * Une branche irrésolvable est conservée en l'état plutôt qu'écartée : mieux vaut une
 * variante pauvre qu'un sélecteur amputé d'une option que le schéma déclare.
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
 * Devine quelle branche d'un `oneOf` décrit la donnée actuelle.
 *
 * Heuristique volontairement simple : on retient la première branche dont toutes les
 * propriétés `required` sont présentes, et dont les éventuelles valeurs `const`
 * correspondent. Suffisant pour les discriminants usuels
 * (`{ required: ['kind'], properties: { kind: { const: 'track' } } }`), et sans coût
 * de validation AJV à chaque frappe.
 *
 * @returns L'index de la branche, ou `-1` si aucune ne correspond franchement.
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
 * Valeur initiale d'une branche, **discriminants inclus**.
 *
 * `createDefaultValue` de JSONForms ignore les `const` : sans ce complément, basculer de
 * variante produirait un objet que `detectOneOfVariant` ne saurait plus rattacher à
 * aucune branche, et le sélecteur retomberait aussitôt sur la première.
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
