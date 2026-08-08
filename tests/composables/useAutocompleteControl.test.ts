import { describe, expect, it } from 'vitest'
import {
  resolveAutocompleteMinLength,
  mapSuggestionsToOptions,
  extractAutocompleteApiConfig,
  buildAutocompleteRequest,
  resolveFetchedOptions,
} from '../../src/composables/useAutocompleteControl'

describe('resolveAutocompleteMinLength', () => {
  it('prefers ui schema value when valid', () => {
    expect(resolveAutocompleteMinLength({ minLength: 5 }, {}, 1)).toBe(5)
  })

  it('falls back to applied options then default', () => {
    expect(resolveAutocompleteMinLength({}, { minLength: 2 }, 1)).toBe(2)
    expect(resolveAutocompleteMinLength({}, {}, 3)).toBe(3)
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
})
