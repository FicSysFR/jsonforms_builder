import { get } from 'radash'
import type { Translator } from '@jsonforms/core'
import {
  getAjvErrorTranslations,
  interpolateAjvErrorMessage,
  type AjvErrorMessageDict,
} from './ajvErrorTranslations'

export type CreateJsonFormsTranslatorOptions = {
  /** Active locale (`fr`, `en`, `fr-FR`…). */
  locale?: string
  /**
   * App / example translations (labels, descriptions, field-specific errors…).
   * Looked up before the built-in AJV error dictionary.
   */
  messages?: Record<string, unknown>
  /**
   * Override or extend built-in AJV error messages for this locale.
   * Merged on top of {@link getAjvErrorTranslations}.
   */
  ajvErrors?: Partial<AjvErrorMessageDict> & Record<string, unknown>
  /**
   * When true (default), missing keys with no `defaultMessage` return `undefined`
   * so JSON Forms can try the next error key in `defaultErrorTranslator`.
   * Set to false only if you intentionally want empty strings for missing labels.
   */
  returnUndefinedWhenMissing?: boolean
}

/**
 * Builds a JSON Forms `translate` function that:
 * 1. Resolves keys from `messages` (nested paths via radash `get`)
 * 2. Falls back to built-in AJV error messages for the locale
 * 3. Interpolates `{{param}}` from `error.params`
 * 4. Returns `undefined` when neither a translation nor a default exists
 *    (required for the AJV error key fallback chain)
 */
export const createJsonFormsTranslator = (
  options: CreateJsonFormsTranslatorOptions = {},
): Translator => {
  const returnUndefinedWhenMissing = options.returnUndefinedWhenMissing !== false
  const ajvDict = {
    ...getAjvErrorTranslations(options.locale),
    ...options.ajvErrors,
    error: {
      ...getAjvErrorTranslations(options.locale).error,
      ...(options.ajvErrors?.error ?? {}),
    },
  }

  return (key, defaultMessage, values) => {
    const fromMessages = options.messages ? (get(options.messages, key) as unknown) : undefined
    const fromAjv = get(ajvDict, key) as unknown
    const raw = typeof fromMessages === 'string' ? fromMessages : typeof fromAjv === 'string' ? fromAjv : undefined

    if (raw !== undefined) {
      return interpolateAjvErrorMessage(raw, values)
    }

    if (defaultMessage !== undefined) {
      return interpolateAjvErrorMessage(defaultMessage, values)
    }

    return returnUndefinedWhenMissing ? undefined : ''
  }
}
