import { computed, ref } from 'vue'
import { get, isArray } from 'radash'
import { useUiControl } from '../utils'
import type { useJsonFormsEnumControl } from '@jsonforms/vue'
import {
  createEnumAdaptTarget,
  normalizeSuggestions,
} from './useEnumSuggestionControl'

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

type JsonFormsEnumControl = ReturnType<typeof useJsonFormsEnumControl>

type UseAutocompleteControlOptions = {
  jsonFormsControl: JsonFormsEnumControl
  clearValue: unknown
  debounceWait?: number
  defaultMinLength?: number
}

export const resolveAutocompleteMinLength = (
  uiOptions: any,
  appliedOptions: any,
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
  uiOptions: any,
  appliedOptions: any,
): AutocompleteApiConfig | undefined => {
  const api = uiOptions?.api ?? appliedOptions?.api
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
  items: any[],
  api: AutocompleteApiConfig,
): Array<{ label: string; value: unknown }> => {
  const labelKey = api.labelKey ?? 'label'
  const valueKey = api.valueKey ?? 'value'

  return items.map((item) => {
    const label = get(item, labelKey)
    const value = get(item, valueKey)

    return {
      label: String(label ?? item?.toString?.() ?? ''),
      value: value ?? item,
    }
  })
}

const isArrayOfOptions = (options: unknown): options is any[] => {
  return Array.isArray(options)
}

const getStaticOptions = (control: JsonFormsEnumControl['control']['value']) => {
  return isArrayOfOptions(control.options) ? control.options : []
}

const filterOptionsBySearch = (options: any[], search: string) => {
  const lowered = search.toLowerCase()

  return options.filter((option) => {
    if (typeof option === 'string') {
      return option.toLowerCase().includes(lowered)
    }

    const label = option?.label ?? option?.toString?.()
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

  const optionsList = ref<any[]>([])
  const abortController = ref<AbortController | null>(null)

  const suggestions = computed(() => {
    const normalized = normalizeSuggestions(
      control.control.value.uischema.options?.suggestion,
    )

    return mapSuggestionsToOptions(normalized)
  })

  const modelValue = computed(() => control.control.value.data)

  const minLength = computed(() =>
    resolveAutocompleteMinLength(
      control.control.value.uischema.options,
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

  const fetchOptions = async (search: string, uiOptions?: any) => {
    const apiConfig = extractAutocompleteApiConfig(
      uiOptions,
      control.appliedOptions.value,
    )

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
      // Une requête annulée par une frappe suivante n'est pas une erreur à signaler.
      if ((error as Error)?.name !== 'AbortError') {
        console.warn('[autocomplete] API error:', error)
      }
      optionsList.value = []
    }
  }

  /**
   * Branché sur `@update:search-term` de `UInputMenu` / `USelectMenu`.
   *
   * La v1 suivait la signature `(value, update, abort)` de `q-select` ; Nuxt UI émet
   * simplement le terme saisi, d'où le changement de contrat en v2.
   */
  const onSearch = async (value: string) => {
    if (!value || value.length < minLength.value) {
      optionsList.value = getStaticOptions(control.control.value)
      return
    }

    const uiOptions = control.control.value.uischema.options
    const apiConfig = extractAutocompleteApiConfig(
      uiOptions,
      control.appliedOptions.value,
    )

    // Sans API déclarée, on filtre les options statiques côté client.
    if (!apiConfig) {
      optionsList.value = filterOptionsBySearch(
        getStaticOptions(control.control.value),
        value,
      )
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
