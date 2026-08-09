/**
 * Default AJV / JSON Schema validation messages for JSON Forms `translate`.
 *
 * Keys follow JSON Forms' `defaultErrorTranslator` lookup order:
 * - `error.<keyword>` — form-wide keyword message
 * - `is a required property` — special rewrite for `required` next to the field
 *
 * Placeholders use `{{param}}` and are filled from `error.params`
 * (see {@link interpolateAjvErrorMessage}).
 */

export type AjvErrorLocale = 'en' | 'fr'

/** Flat or nested message map compatible with radash `get(dict, key)`. */
export type AjvErrorMessageDict = {
  error: Record<string, string>
  /** JSON Forms rewrites required errors to this key when shown next to the control. */
  'is a required property': string
}

export const ajvErrorTranslations: Record<AjvErrorLocale, AjvErrorMessageDict> = {
  en: {
    error: {
      required: 'is a required property',
      type: 'must be {{type}}',
      enum: 'must be equal to one of the allowed values',
      const: 'must be equal to constant',
      format: 'must match format "{{format}}"',
      pattern: 'must match pattern "{{pattern}}"',
      minLength: 'must NOT have fewer than {{limit}} characters',
      maxLength: 'must NOT have more than {{limit}} characters',
      minimum: 'must be >= {{limit}}',
      maximum: 'must be <= {{limit}}',
      exclusiveMinimum: 'must be > {{limit}}',
      exclusiveMaximum: 'must be < {{limit}}',
      multipleOf: 'must be a multiple of {{multipleOf}}',
      minItems: 'must NOT have fewer than {{limit}} items',
      maxItems: 'must NOT have more than {{limit}} items',
      uniqueItems: 'must NOT have duplicate items',
      minProperties: 'must NOT have fewer than {{limit}} properties',
      maxProperties: 'must NOT have more than {{limit}} properties',
      additionalProperties: 'must NOT have additional properties',
      additionalItems: 'must NOT have more items than allowed',
      contains: 'must contain a valid item',
      minContains: 'must contain at least {{limit}} valid items',
      maxContains: 'must contain at most {{limit}} valid items',
      oneOf: 'must match exactly one schema in "oneOf"',
      anyOf: 'must match a schema in "anyOf"',
      allOf: 'must match all schemas in "allOf"',
      not: 'must NOT be valid according to schema in "not"',
      if: 'must match "{{failingKeyword}}" schema',
      dependentRequired: 'must have properties {{deps}} when property {{property}} is present',
      propertyNames: 'property name is invalid',
      unevaluatedProperties: 'must NOT have unevaluated properties',
      unevaluatedItems: 'must NOT have unevaluated items',
    },
    'is a required property': 'is a required property',
  },
  fr: {
    error: {
      required: 'est une propriété obligatoire',
      type: 'doit être de type {{type}}',
      enum: 'doit être égal à une des valeurs autorisées',
      const: 'doit être égal à la constante',
      format: 'doit correspondre au format « {{format}} »',
      pattern: 'doit correspondre au motif « {{pattern}} »',
      minLength: 'doit contenir au moins {{limit}} caractère(s)',
      maxLength: 'ne doit pas dépasser {{limit}} caractère(s)',
      minimum: 'doit être ≥ {{limit}}',
      maximum: 'doit être ≤ {{limit}}',
      exclusiveMinimum: 'doit être > {{limit}}',
      exclusiveMaximum: 'doit être < {{limit}}',
      multipleOf: 'doit être un multiple de {{multipleOf}}',
      minItems: 'doit contenir au moins {{limit}} élément(s)',
      maxItems: 'ne doit pas contenir plus de {{limit}} élément(s)',
      uniqueItems: 'ne doit pas contenir de doublons',
      minProperties: 'doit contenir au moins {{limit}} propriété(s)',
      maxProperties: 'ne doit pas contenir plus de {{limit}} propriété(s)',
      additionalProperties: 'ne doit pas contenir de propriétés additionnelles',
      additionalItems: 'ne doit pas contenir plus d’éléments que autorisé',
      contains: 'doit contenir un élément valide',
      minContains: 'doit contenir au moins {{limit}} élément(s) valide(s)',
      maxContains: 'doit contenir au plus {{limit}} élément(s) valide(s)',
      oneOf: 'doit correspondre à exactement un schéma de « oneOf »',
      anyOf: 'doit correspondre à un schéma de « anyOf »',
      allOf: 'doit correspondre à tous les schémas de « allOf »',
      not: 'est invalide selon le schéma « not »',
      if: 'doit correspondre au schéma « {{failingKeyword}} »',
      dependentRequired:
        'doit avoir la/les propriété(s) {{deps}} quand {{property}} est présent',
      propertyNames: 'le nom de propriété est invalide',
      unevaluatedProperties: 'ne doit pas contenir de propriétés non évaluées',
      unevaluatedItems: 'ne doit pas contenir d’éléments non évalués',
    },
    'is a required property': 'est une propriété obligatoire',
  },
}

/**
 * Resolves built-in AJV error messages for a locale.
 * Falls back to English when the locale is unknown; accepts `fr-FR` → `fr`.
 */
export const getAjvErrorTranslations = (locale?: string): AjvErrorMessageDict => {
  const normalized = normalizeAjvErrorLocale(locale)
  return ajvErrorTranslations[normalized]
}

export const normalizeAjvErrorLocale = (locale?: string): AjvErrorLocale => {
  if (!locale) {
    return 'en'
  }
  const base = locale.toLowerCase().split(/[_-]/)[0] ?? 'en'
  return base === 'fr' ? 'fr' : 'en'
}

/**
 * Replaces `{{param}}` placeholders using AJV `error.params` and optional context.
 */
export const interpolateAjvErrorMessage = (
  template: string,
  values?: { error?: { params?: Record<string, unknown>; keyword?: string } } & Record<
    string,
    unknown
  >,
): string => {
  if (!template.includes('{{')) {
    return template
  }
  const params: Record<string, unknown> = {
    ...(values?.error?.params ?? {}),
    keyword: values?.error?.keyword,
    ...values,
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = params[key]
    if (value === undefined || value === null) {
      return ''
    }
    if (Array.isArray(value)) {
      return value.map(String).join(', ')
    }
    return String(value)
  })
}
