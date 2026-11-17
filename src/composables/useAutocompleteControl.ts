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

/** Request built from a UI schema's `options.api`, as the host policy receives it. */
export type AutocompleteApiRequest = {
  /** Absolute URL, query parameters included. */
  url: URL
  headers: Record<string, string>
  search: string
  api: AutocompleteApiConfig
  signal: AbortSignal
}

/**
 * Host policy for `options.api`. A UI schema may come from a less trusted source than the host
 * (an extension, a stored definition), so the policy is read from JSON Forms `config.apiPolicy`
 * only, never from `uischema.options`.
 *
 * Without a policy, no request is sent: the host allow-lists origins or resolves requests.
 */
export type AutocompleteApiPolicy = {
  /**
   * Host fetcher, given every request instead of the library's `fetch`: it can authenticate,
   * proxy, cache or refuse (throw). Returns the response payload; `itemsPath` then applies.
   * Non-HTTP(S) URLs and URLs carrying credentials never reach it.
   */
  resolve?: (request: AutocompleteApiRequest) => Promise<unknown>
  /**
   * Exact origins (`https://api.example.com`) the library may fetch itself. `'self'` stands for
   * the page's origin and sends its cookies (`credentials: 'same-origin'`).
   */
  allowedOrigins?: readonly string[]
  /** `credentials` for the other allow-listed origins. Default `'omit'`. */
  credentials?: RequestCredentials
  /**
   * Request headers (case-insensitive) a UI schema may send besides the CORS-safelisted
   * `Accept`, `Accept-Language` and `Content-Language`. Headers of a host `config.api` are kept.
   */
  allowedHeaders?: readonly string[]
}

export type AutocompleteApiDecision =
  | { allowed: true; credentials: RequestCredentials }
  | { allowed: false; reason: string }

/** Checks shared by the library's `fetch` and the host resolver; a reason when refused. */
export const checkAutocompleteUrl = (url: URL): string | undefined => {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return `scheme ${url.protocol} is not fetched`
  }
  if (url.username || url.password) {
    return 'URLs carrying credentials are not fetched'
  }
  return undefined
}

const listFrom = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : []

/**
 * Whether the library may itself fetch `url`: only an origin the host allow-lists, the page's
 * own through `'self'` (with its cookies), any other without cookies unless the policy says
 * otherwise. Non-HTTP(S) URLs and URLs carrying credentials: never.
 */
export const decideAutocompleteRequest = (
  url: URL,
  policy: AutocompleteApiPolicy | undefined,
  pageOrigin: string,
): AutocompleteApiDecision => {
  const invalid = checkAutocompleteUrl(url)
  if (invalid) {
    return { allowed: false, reason: invalid }
  }
  const allowedOrigins = listFrom(policy?.allowedOrigins)
  if (url.origin === pageOrigin && allowedOrigins.includes('self')) {
    return { allowed: true, credentials: 'same-origin' }
  }
  if (allowedOrigins.includes(url.origin)) {
    return { allowed: true, credentials: policy?.credentials ?? 'omit' }
  }
  return {
    allowed: false,
    reason: `origin ${url.origin} is not in config.apiPolicy.allowedOrigins`,
  }
}

const SAFELISTED_HEADERS = new Set(['accept', 'accept-language', 'content-language'])

/**
 * Headers a request may carry: all of a host `config.api`; from a UI schema, the
 * CORS-safelisted ones plus `policy.allowedHeaders`.
 */
export const filterAutocompleteHeaders = (
  headers: Record<string, string> | undefined,
  policy: AutocompleteApiPolicy | undefined,
  fromHost: boolean,
): Record<string, string> => {
  if (!headers) return {}
  if (fromHost) return headers
  const allowed = new Set(listFrom(policy?.allowedHeaders).map((name) => name.toLowerCase()))
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => {
      const key = name.toLowerCase()
      return SAFELISTED_HEADERS.has(key) || allowed.has(key)
    }),
  )
}

const pageLocation = () => (typeof location === 'undefined' ? undefined : location.href)

/** Host policy from JSON Forms `config` (never merged with the UI schema options). */
const readApiPolicy = (config: unknown): AutocompleteApiPolicy | undefined => {
  const policy = (config as { apiPolicy?: unknown } | undefined)?.apiPolicy
  return policy && typeof policy === 'object' ? (policy as AutocompleteApiPolicy) : undefined
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
  /** Base for a relative `url` without `base`: the page URL in a browser. */
  pageUrl: string | undefined = pageLocation(),
): { url: string; headers: Record<string, string> } => {
  const baseUrl = new URL(api.url, api.base ?? pageUrl)

  if (api.params) {
    Object.entries(api.params).forEach(([key, value]) => {
      baseUrl.searchParams.set(key, String(value))
    })
  }
  // Last, so that fixed params never replace the typed term.
  baseUrl.searchParams.set(api.queryKey ?? 'q', search)

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

  /**
   * The `api` object comes whole from the UI schema (`options.api`) or, failing that, from the
   * host's raw `config.api`: never a deep merge of both, which could pair host headers with a
   * URL the schema chose.
   */
  const resolveApiSource = (uiOptions?: UiOptionBag) => {
    const schemaOptions =
      uiOptions ?? (control.control.value.uischema.options as UiOptionBag | undefined)
    const fromSchema = extractAutocompleteApiConfig(schemaOptions, undefined)
    if (fromSchema) return { api: fromSchema, fromHost: false }
    const fromHost = extractAutocompleteApiConfig(
      undefined,
      control.control.value.config as UiOptionBag | undefined,
    )
    return fromHost ? { api: fromHost, fromHost: true } : undefined
  }

  const fetchOptions = async (search: string, uiOptions?: UiOptionBag) => {
    const source = resolveApiSource(uiOptions)
    const apiConfig = source?.api

    if (!source || !apiConfig) {
      optionsList.value = []
      return
    }

    clearPendingRequest()
    const controller = new AbortController()
    abortController.value = controller

    try {
      const request = buildAutocompleteRequest(apiConfig, search)
      const url = new URL(request.url)
      const policy = readApiPolicy(control.control.value.config)
      const headers = filterAutocompleteHeaders(request.headers, policy, source.fromHost)
      let data: unknown

      const invalid = checkAutocompleteUrl(url)
      if (invalid) {
        console.warn(`[autocomplete] request refused: ${invalid}`)
        optionsList.value = []
        return
      }

      if (policy?.resolve) {
        data = await policy.resolve({
          url,
          headers,
          search,
          api: apiConfig,
          signal: controller.signal,
        })
      } else {
        // Outside a browser no origin counts as the page's: only allow-listed origins pass.
        const page = pageLocation()
        const decision = decideAutocompleteRequest(
          url,
          policy,
          page ? new URL(page).origin : 'null',
        )
        if (!decision.allowed) {
          console.warn(`[autocomplete] request refused: ${decision.reason}`)
          optionsList.value = []
          return
        }

        const response = await fetch(request.url, {
          signal: controller.signal,
          headers,
          credentials: decision.credentials,
          // A redirect could carry the typed term to an origin the host never allowed.
          redirect: 'error',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        data = await response.json()
      }

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

    // With no declared API, filter static options on the client.
    if (!resolveApiSource()) {
      optionsList.value = filterOptionsBySearch(getStaticOptions(control.control.value), value)
      return
    }

    await fetchOptions(value)
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
