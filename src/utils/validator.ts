import { createAjv as createAjvCore } from '@jsonforms/core'
import type Ajv from 'ajv'
import type { Options } from 'ajv'

/**
 * Custom formats used for renderer selection (password, color, data-url).
 * Registered as permissive so AJV does not warn "unknown format … ignored".
 */
const CUSTOM_FORMATS = ['password', 'color', 'data-url'] as const

export const createAjv = (options?: Options): Ajv => {
  const ajv = createAjvCore(options)
  for (const format of CUSTOM_FORMATS) {
    ajv.addFormat(format, () => true)
  }

  return ajv
}
