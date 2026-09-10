import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  resolveAutocompleteMinLength,
  mapSuggestionsToOptions,
  extractAutocompleteApiConfig,
  buildAutocompleteRequest,
  resolveFetchedOptions,
  useAutocompleteControl,
} from '../../src/composables/useAutocompleteControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('resolveAutocompleteMinLength', () => {
  it('prefers ui schema value when valid', () => {
    expect(resolveAutocompleteMinLength({ minLength: 5 }, {}, 1)).toBe(5)
  })

  it('falls back to applied options then default', () => {
    expect(resolveAutocompleteMinLength({}, { minLength: 2 }, 1)).toBe(2)
    expect(resolveAutocompleteMinLength({}, {}, 3)).toBe(3)
    expect(resolveAutocompleteMinLength({ minLength: 'invalid' }, { minLength: 0 }, 4)).toBe(4)
  })
})

describe('mapSuggestionsToOptions', () => {
  it('returns formatted suggestions or undefined', () => {
    expect(mapSuggestionsToOptions(undefined)).toBeUndefined()
    expect(mapSuggestionsToOptions(['a', 'b'])).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ])
  })
})

describe('extractAutocompleteApiConfig', () => {
  it('prefers ui schema api over applied options', () => {
    const uiOptions = { api: { url: 'https://example.com/search' } }
    const applied = { api: { url: 'https://ignored.com' } }

    expect(extractAutocompleteApiConfig(uiOptions, applied)).toEqual(uiOptions.api)
  })

  it('returns undefined when url missing', () => {
    expect(extractAutocompleteApiConfig({}, { api: {} })).toBeUndefined()
  })
})

describe('buildAutocompleteRequest', () => {
  it('builds absolute url with params and headers', () => {
    const request = buildAutocompleteRequest(
      {
        url: '/search',
        base: 'https://example.com',
        queryKey: 'term',
        params: { limit: 5 },
        headers: { Authorization: 'Bearer token' },
      },
      'vue',
    )

    expect(request.url).toBe('https://example.com/search?term=vue&limit=5')
    expect(request.headers).toEqual({ Authorization: 'Bearer token' })
  })

  it('uses default query and header settings', () => {
    expect(buildAutocompleteRequest({ url: 'https://example.com/search' }, 'vue')).toEqual({
      url: 'https://example.com/search?q=vue',
      headers: {},
    })
  })
})

describe('resolveFetchedOptions', () => {
  it('maps fetched items using label/value keys', () => {
    const items = [
      { name: 'Alice', id: 1 },
      { name: 'Bob', id: 2 },
    ]

    expect(
      resolveFetchedOptions(items, {
        url: 'irrelevant',
        labelKey: 'name',
        valueKey: 'id',
      }),
    ).toEqual([
      { label: 'Alice', value: 1 },
      { label: 'Bob', value: 2 },
    ])
  })

  it('falls back to default keys and primitive values', () => {
    expect(
      resolveFetchedOptions([{ label: 'One', value: 1 }, 'plain'], { url: 'irrelevant' }),
    ).toEqual([
      { label: 'One', value: 1 },
      { label: 'plain', value: 'plain' },
    ])
  })
})

describe('useAutocompleteControl', () => {
  const mountAutocomplete = (overrides = {}) =>
    mountControl(
      (jsonFormsControl) =>
        useAutocompleteControl({
          jsonFormsControl,
          clearValue: null,
          debounceWait: undefined,
          defaultMinLength: 3,
        }),
      overrides,
    )

  it('switches between static filtering and suggestions', async () => {
    const mounted = mountAutocomplete({
      options: [
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ],
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { suggestion: ['Suggested'] },
      },
    })

    expect(mounted.result.modelValue.value).toBe('initial')
    expect(mounted.result.minLength.value).toBe(3)
    expect(mounted.result.selectOptions.value).toHaveLength(2)

    await mounted.result.onSearch('al')
    expect(mounted.result.optionsList.value).toHaveLength(2)

    await mounted.result.onSearch('alp')
    expect(mounted.result.optionsList.value).toEqual([{ label: 'Alpha', value: 'a' }])

    mounted.result.optionsList.value = []
    mounted.state.value.options = []
    await nextTick()
    expect(mounted.result.selectOptions.value).toEqual([{ label: 'Suggested', value: 'Suggested' }])
    mounted.stop()
  })

  it('fetches nested remote items with the configured request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ payload: { users: [{ name: 'Ada', id: 7 }] } }), {
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const mounted = mountAutocomplete({
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: {
          minLength: 2,
          api: {
            url: '/users',
            base: 'https://api.example.test',
            queryKey: 'search',
            itemsPath: 'payload.users',
            labelKey: 'name',
            valueKey: 'id',
            headers: { 'x-api-key': 'test' },
          },
        },
      },
    })

    await mounted.result.onSearch('ada')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.test/users?search=ada')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { 'x-api-key': 'test' } })
    expect(mounted.result.optionsList.value).toEqual([{ label: 'Ada', value: 7 }])
    mounted.stop()
  })

  it('normalizes invalid payloads and reports HTTP failures', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: 'not-an-array' }), {
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('Unavailable', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    const mounted = mountAutocomplete({
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { api: { url: 'https://api.example.test/users', itemsPath: 'items' } },
      },
    })

    await mounted.result.fetchOptions('first')
    expect(mounted.result.optionsList.value).toEqual([])
    await mounted.result.fetchOptions('second')
    expect(warn).toHaveBeenCalledWith('[autocomplete] API error:', expect.any(Error))
    mounted.stop()
  })

  it('aborts the previous request without logging it as an API error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    let firstSignal: AbortSignal | undefined
    const fetchMock = vi
      .fn()
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        firstSignal = init.signal as AbortSignal
        return new Promise<Response>((_resolve, reject) => {
          firstSignal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      })
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ label: 'Latest', value: 'latest' }]), {
          headers: { 'content-type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const mounted = mountAutocomplete({
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { api: { url: 'https://api.example.test/users' } },
      },
    })

    const firstRequest = mounted.result.fetchOptions('first')
    await mounted.result.fetchOptions('latest')
    await firstRequest

    expect(firstSignal?.aborted).toBe(true)
    expect(warn).not.toHaveBeenCalled()
    expect(mounted.result.optionsList.value).toEqual([{ label: 'Latest', value: 'latest' }])
    mounted.stop()
  })

  it('clears stale options when no API is configured', async () => {
    const mounted = mountAutocomplete()
    mounted.result.optionsList.value = [{ label: 'Stale', value: 'stale' }]

    await mounted.result.fetchOptions('anything')

    expect(mounted.result.optionsList.value).toEqual([])
    mounted.stop()
  })
})
