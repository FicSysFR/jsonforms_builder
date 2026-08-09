import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import type { FormDefinition } from './useFormBuilder'

/** Default `localStorage` key used by `<FormBuilder>` when persistence is enabled. */
export const DEFAULT_FORM_BUILDER_STORAGE_KEY = '@tacxou/jsonforms_builder:draft'

export interface PersistedFormDraft extends FormDefinition {
  /** Preview instance data, when previously saved. */
  data?: unknown
}

/** Minimal storage surface (`localStorage` / in-memory mocks). */
export interface FormDraftStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/**
 * True when the definition already carries fields or layout elements —
 * used to prefer an explicit `v-model` over a stored draft.
 */
export const isMeaningfulDefinition = (value?: Partial<FormDefinition>): boolean => {
  if (!value) {
    return false
  }

  const properties = (value.schema as JsonSchema | undefined)?.properties
  if (properties && Object.keys(properties).length > 0) {
    return true
  }

  const elements = (value.uischema as { elements?: unknown[] } | undefined)?.elements
  return Array.isArray(elements) && elements.length > 0
}

/** Reads a draft from storage; returns `undefined` when missing or malformed. */
export const readFormDraft = (
  storage: FormDraftStorage,
  key: string,
): PersistedFormDraft | undefined => {
  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return undefined
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isPlainObject(parsed) || !isPlainObject(parsed.schema) || !isPlainObject(parsed.uischema)) {
      return undefined
    }

    return {
      schema: parsed.schema as JsonSchema,
      uischema: parsed.uischema as UISchemaElement,
      data: 'data' in parsed ? parsed.data : undefined,
    }
  } catch {
    return undefined
  }
}

/** Persists `{ schema, uischema, data }` — quota / privacy errors are ignored. */
export const writeFormDraft = (
  storage: FormDraftStorage,
  key: string,
  draft: PersistedFormDraft,
): void => {
  try {
    storage.setItem(
      key,
      JSON.stringify({
        schema: draft.schema,
        uischema: draft.uischema,
        data: draft.data,
      }),
    )
  } catch {
    // QuotaExceeded / SecurityError — draft persistence is best-effort.
  }
}

export const clearFormDraft = (storage: FormDraftStorage, key: string): void => {
  try {
    storage.removeItem(key)
  } catch {
    // Same best-effort contract as write.
  }
}

/** Browser `localStorage` when available (SSR / restricted contexts → `undefined`). */
export const getBrowserFormDraftStorage = (): FormDraftStorage | undefined => {
  try {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return undefined
    }
    return globalThis.localStorage
  } catch {
    return undefined
  }
}
