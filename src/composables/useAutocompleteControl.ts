import { computed, ref } from 'vue'
import { get, isArray } from 'radash'
import { useUiControl, type UiOptionBag } from '../utils'
import type { EnumOption } from '@jsonforms/core'
import type { useJsonFormsEnumControl } from '@jsonforms/vue'
import { createEnumAdaptTarget, normalizeSuggestions } from './useEnumSuggestionControl'

export interface AutocompleteApiConfig {
  url: string
  base?: string
  queryKey?: string
  labelKey?: string
  valueKey?: string
  itemsPath?: string
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

export type AutocompleteOption = {
  label: string
  value: unknown
}

type JsonFormsEnumControl = ReturnType<typeof useJsonFormsEnumControl>

type UseAutocompleteControlOptions = {
  jsonFormsControl: JsonFormsEnumControl
  clearValue: unknown
  debounceWait?: number
  defaultMinLength?: number
}

export const resolveAutocompleteMinLength = (
  uiOptions: UiOptionBag | undefined,
  appliedOptions: UiOptionBag | undefined,
  fallback: number,
): number => {
  const uiValue = Number(uiOptions?.minLength)
  if (!Number.isNaN(uiValue) && uiValue > 0) {
    return uiValue
  }

  const appliedValue = Number(appliedOptions?.minLength)
  if (!Number.isNaN(appliedValue) && appliedValue > 0) {
    return appliedValue
  }

  return fallback
}

export const mapSuggestionsToOptions = (
  suggestions: string[] | undefined,
): Array<{ label: string; value: string }> | undefined => {
  if (!suggestions?.length) {
    return undefined
  }

  return suggestions.map((label) => ({ label, value: label }))
}

export const extractAutocompleteApiConfig = (
  uiOptions: UiOptionBag | undefined,
  appliedOptions: UiOptionBag | undefined,
): AutocompleteApiConfig | undefined => {
  const api = (uiOptions?.api ?? appliedOptions?.api) as AutocompleteApiConfig | undefined
  if (!api?.url) {
    return undefined
  }

  return api
}

export const buildAutocompleteRequest = (
  api: AutocompleteApiConfig,
  search: string,
): { url: string; headers: Record<string, string> } => {
  const baseUrl = api.base ? new URL(api.url, api.base) : new URL(api.url)
  const queryKey = api.queryKey ?? 'q'
  baseUrl.searchParams.set(queryKey, search)

  if (api.params) {
    Object.entries(api.params).forEach(([key, value]) => {
      baseUrl.searchParams.set(key, String(value))
    })
  }

  return {
    url: baseUrl.toString(),
    headers: api.headers ?? {},
  }
}

export const resolveFetchedOptions = (
  items: unknown[],
  api: AutocompleteApiConfig,
): AutocompleteOption[] => {
  const labelKey = api.labelKey ?? 'label'
  const valueKey = api.valueKey ?? 'value'

  return items.map((item) => {
    const label = get(item as object, labelKey)
    const value = get(item as object, valueKey)

    return {
      label: String(label ?? (item as { toString?: () => string })?.toString?.() ?? ''),
      value: value ?? item,
    }
  })
}

const isArrayOfOptions = (options: unknown): options is EnumOption[] => {
  return Array.isArray(options)
}

const getStaticOptions = (control: JsonFormsEnumControl['control']['value']) => {
  return isArrayOfOptions(control.options) ? control.options : []
}

const filterOptionsBySearch = (options: EnumOption[], search: string) => {
  const lowered = search.toLowerCase()

  return options.filter((option) => {
    const label = option.label ?? option.toString?.()
    return typeof label === 'string' && label.toLowerCase().includes(lowered)
  })
}

export const useAutocompleteControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait = 100,
  defaultMinLength = 3,
}: UseAutocompleteControlOptions) => {
  const adaptTarget = createEnumAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const optionsList = ref<AutocompleteOption[]>([])
  const abortController = ref<AbortController | null>(null)

  const suggestions = computed(() => {
    const normalized = normalizeSuggestions(control.control.value.uischema.options?.suggestion)

    return mapSuggestionsToOptions(normalized)
  })

  const modelValue = computed(() => control.control.value.data)

  const minLength = computed(() =>
    resolveAutocompleteMinLength(
      control.control.value.uischema.options as UiOptionBag | undefined,
      control.appliedOptions.value,
      defaultMinLength,
    ),
  )

  const selectOptions = computed(() => {
    if (optionsList.value.length > 0) {
      return optionsList.value
    }

    const staticOptions = getStaticOptions(control.control.value)
    if (staticOptions.length > 0) {
      return staticOptions
    }

    return suggestions.value ?? []
  })

  const clearPendingRequest = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
  }

  const fetchOptions = async (search: string, uiOptions?: UiOptionBag) => {
    const apiConfig = extractAutocompleteApiConfig(uiOptions, control.appliedOptions.value)

    if (!apiConfig) {
      optionsList.value = []
      return
    }

    const request = buildAutocompleteRequest(apiConfig, search)

    clearPendingRequest()
    abortController.value = new AbortController()

    try {
      const response = await fetch(request.url, {
        signal: abortController.value.signal,
        headers: request.headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const rawItems = apiConfig.itemsPath ? get(data, apiConfig.itemsPath) : data
      const items = isArray(rawItems) ? rawItems : []
      optionsList.value = resolveFetchedOptions(items, apiConfig)
    } catch (error) {
      // A request aborted by a subsequent keystroke is not an error to report.
      if ((error as Error)?.name !== 'AbortError') {
        console.warn('[autocomplete] API error:', error)
      }
      optionsList.value = []
    }
  }

  /**
   * Wired to `@update:search-term` on `UInputMenu` / `USelectMenu`.
   *
   * v1 followed the `(value, update, abort)` signature of `q-select`; Nuxt UI simply emits
   * the typed term, hence the contract change in v2.
   */
  const onSearch = async (value: string) => {
    if (!value || value.length < minLength.value) {
      optionsList.value = getStaticOptions(control.control.value)
      return
    }

    const uiOptions = control.control.value.uischema.options as UiOptionBag | undefined
    const apiConfig = extractAutocompleteApiConfig(uiOptions, control.appliedOptions.value)

    // With no declared API, filter static options on the client.
    if (!apiConfig) {
      optionsList.value = filterOptionsBySearch(getStaticOptions(control.control.value), value)
      return
    }

    await fetchOptions(value, uiOptions)
  }

  return {
    ...control,
    adaptTarget,
    optionsList,
    selectOptions,
    suggestions,
    minLength,
    fetchOptions,
    onSearch,
    modelValue,
  }
}
