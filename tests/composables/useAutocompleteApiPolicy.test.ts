/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAutocompleteRequest,
  decideAutocompleteRequest,
  useAutocompleteControl,
} from '../../src/composables/useAutocompleteControl'
import { mountControl } from '../helpers/controlHarness'

const PAGE = 'https://app.example.test/forms/edit'

describe('decideAutocompleteRequest', () => {
  const origin = new URL(PAGE).origin
  const decide = (url: string, policy?: Parameters<typeof decideAutocompleteRequest>[1]) =>
    decideAutocompleteRequest(new URL(url, PAGE), policy, origin)

  it('refuses every request without a host policy, same origin included', () => {
    expect(decide('/api/cities')).toMatchObject({ allowed: false })
    expect(decide('/api/cities', { allowedOrigins: [] })).toMatchObject({ allowed: false })
  })

  it("allows the page's origin, with its cookies, once the host lists 'self'", () => {
    expect(decide('/api/cities', { allowedOrigins: ['self'] })).toEqual({
      allowed: true,
      credentials: 'same-origin',
    })
  })

  it('ignores a policy whose allowedOrigins is not an array', () => {
    const typo = { allowedOrigins: 'https://api.other.test' } as unknown as Parameters<
      typeof decideAutocompleteRequest
    >[1]
    expect(decide('https://api.other.test/x', typo)).toMatchObject({ allowed: false })
  })

  it('refuses URLs carrying credentials', () => {
    expect(
      decide('https://user:pass@api.other.test/x', { allowedOrigins: ['https://api.other.test'] }),
    ).toMatchObject({ allowed: false })
  })

  it('refuses another origin unless the host allow-lists it', () => {
    expect(decide('https://api.other.test/cities')).toMatchObject({ allowed: false })
    expect(
      decide('https://api.other.test/cities', { allowedOrigins: ['https://api.other.test'] }),
    ).toEqual({ allowed: true, credentials: 'omit' })
  })

  it('matches origins exactly: scheme, host and port', () => {
    const policy = { allowedOrigins: ['https://api.other.test'] }
    expect(decide('http://api.other.test/x', policy)).toMatchObject({ allowed: false })
    expect(decide('https://api.other.test:8443/x', policy)).toMatchObject({ allowed: false })
    expect(decide('https://api.other.test.evil.test/x', policy)).toMatchObject({ allowed: false })
  })

  it('never fetches a non-HTTP URL', () => {
    expect(decide('javascript:alert(1)')).toMatchObject({ allowed: false })
    expect(decide('data:application/json,[]')).toMatchObject({ allowed: false })
  })

  it('applies the credentials the host chose for allow-listed origins', () => {
    expect(
      decide('https://api.other.test/x', {
        allowedOrigins: ['https://api.other.test'],
        credentials: 'include',
      }),
    ).toEqual({ allowed: true, credentials: 'include' })
  })
})

describe('buildAutocompleteRequest', () => {
  it('resolves a relative URL against the page instead of throwing', () => {
    const request = buildAutocompleteRequest({ url: '/api/cities' }, 'par', PAGE)
    expect(request.url).toBe('https://app.example.test/api/cities?q=par')
  })

  it('keeps the search term when params reuse the query key', () => {
    const request = buildAutocompleteRequest(
      { url: '/api/cities', params: { q: 'fixed', limit: 5 } },
      'par',
      PAGE,
    )
    expect(new URL(request.url).searchParams.get('q')).toBe('par')
    expect(new URL(request.url).searchParams.get('limit')).toBe('5')
  })
})

describe('useAutocompleteControl with a host policy', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const mount = (api: Record<string, unknown>, config: Record<string, unknown> = {}) =>
    mountControl(
      (jsonFormsControl) =>
        useAutocompleteControl({ jsonFormsControl, clearValue: undefined, defaultMinLength: 1 }),
      {
        uischema: { type: 'Control', scope: '#/properties/value', options: { api } },
        config,
      },
    )

  it('hands every request to the host resolver instead of fetching', async () => {
    const resolve = vi.fn(async () => ({ data: [{ name: 'Paris', id: 75 }] }))
    const mounted = mount(
      { url: 'https://anywhere.test/cities', itemsPath: 'data', labelKey: 'name', valueKey: 'id' },
      { apiPolicy: { resolve } },
    )

    await mounted.result.onSearch('par')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(resolve).toHaveBeenCalledTimes(1)
    const [request] = resolve.mock.calls[0] as unknown as [{ url: URL; search: string }]
    expect(request.url.href).toBe('https://anywhere.test/cities?q=par')
    expect(request.search).toBe('par')
    expect(mounted.result.optionsList.value).toEqual([{ label: 'Paris', value: 75 }])
    mounted.stop()
  })

  it('sends no request to an origin the host did not allow', async () => {
    const mounted = mount({ url: 'https://tracker.test/collect' })
    await mounted.result.onSearch('secret')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mounted.result.optionsList.value).toEqual([])
    mounted.stop()
  })

  it('fetches an allow-listed origin without cookies or redirects', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ['Lyon'] })
    const mounted = mount(
      { url: 'https://api.other.test/cities' },
      { apiPolicy: { allowedOrigins: ['https://api.other.test'] } },
    )
    await mounted.result.onSearch('ly')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.other.test/cities?q=ly',
      expect.objectContaining({ credentials: 'omit', redirect: 'error' }),
    )
    mounted.stop()
  })

  it('sends only safelisted headers from the UI schema unless the host allows more', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
    const api = {
      url: 'https://api.other.test/cities',
      headers: { Accept: 'application/json', Authorization: 'Bearer x', 'X-Other': '1' },
    }
    const strict = mount(api, { apiPolicy: { allowedOrigins: ['https://api.other.test'] } })
    await strict.result.onSearch('ly')
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ Accept: 'application/json' })
    strict.stop()

    const relaxed = mount(api, {
      apiPolicy: { allowedOrigins: ['https://api.other.test'], allowedHeaders: ['authorization'] },
    })
    await relaxed.result.onSearch('ly')
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer x',
    })
    relaxed.stop()
  })

  it('never merges host config.api secrets into the UI schema api', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
    const mounted = mount(
      { url: 'https://api.other.test/cities' },
      {
        api: { url: 'https://host.test/cities', headers: { 'X-Secret': 'host-only' } },
        apiPolicy: { allowedOrigins: ['https://api.other.test'], allowedHeaders: ['x-secret'] },
      },
    )
    await mounted.result.onSearch('ly')
    await mounted.result.fetchOptions('ly')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toBe('https://api.other.test/cities?q=ly')
      expect(init.headers).toEqual({})
    }
    mounted.stop()
  })

  it('checks the URL before the host resolver and never falls back to fetch', async () => {
    const resolve = vi.fn(async () => {
      throw new Error('refused by the host')
    })
    const unsafe = mount({ url: 'javascript:alert(1)' }, { apiPolicy: { resolve } })
    await unsafe.result.onSearch('x')
    expect(resolve).not.toHaveBeenCalled()
    unsafe.stop()

    const refused = mount({ url: 'https://anywhere.test/x' }, { apiPolicy: { resolve } })
    await refused.result.onSearch('x')
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(refused.result.optionsList.value).toEqual([])
    refused.stop()
  })

  it('ignores a policy written in the UI schema', async () => {
    const mounted = mountControl(
      (jsonFormsControl) =>
        useAutocompleteControl({ jsonFormsControl, clearValue: undefined, defaultMinLength: 1 }),
      {
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: {
            api: { url: 'https://tracker.test/collect' },
            apiPolicy: { allowedOrigins: ['https://tracker.test'] },
          },
        },
      },
    )
    await mounted.result.onSearch('secret')

    expect(fetchMock).not.toHaveBeenCalled()
    mounted.stop()
  })
})
