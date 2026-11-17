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

  it('lets same-origin requests through with same-origin credentials, as before', () => {
    expect(decide('/api/cities')).toEqual({ allowed: true, credentials: 'same-origin' })
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

  it('fetches an allow-listed origin without cookies', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ['Lyon'] })
    const mounted = mount(
      { url: 'https://api.other.test/cities' },
      { apiPolicy: { allowedOrigins: ['https://api.other.test'] } },
    )
    await mounted.result.onSearch('ly')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.other.test/cities?q=ly',
      expect.objectContaining({ credentials: 'omit' }),
    )
    mounted.stop()
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
