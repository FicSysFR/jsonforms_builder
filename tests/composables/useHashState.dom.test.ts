// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { useHashState, type UseHashStateResult } from '../../src/composables/useHashState'

const mountedInstances: Array<ReturnType<typeof createApp>> = []

const mountHashState = () => {
  let hashState: UseHashStateResult | undefined
  const app = createApp(
    defineComponent({
      setup() {
        hashState = useHashState()
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  mountedInstances.push(app)

  if (!hashState) {
    throw new Error('Hash state was not initialized')
  }

  return hashState
}

beforeEach(() => {
  window.history.replaceState(null, '', '/builder?mode=edit#tab=details')
})

afterEach(() => {
  for (const app of mountedInstances.splice(0)) {
    app.unmount()
  }
  vi.restoreAllMocks()
})

describe('useHashState browser lifecycle', () => {
  it('hydrates from the URL and replaces history after state changes', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const hashState = mountHashState()

    expect(hashState.state.value).toEqual({ tab: 'details' })

    hashState.set({ tab: 'preview', panel: 'schema' })
    await nextTick()

    expect(replaceState).toHaveBeenLastCalledWith(
      null,
      '',
      '/builder?mode=edit#tab=preview&panel=schema',
    )
    expect(window.location.hash).toBe('#tab=preview&panel=schema')
  })

  it('does not rewrite an already normalized URL', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    mountHashState()
    await nextTick()

    expect(replaceState).not.toHaveBeenCalled()
  })

  it('reacts to external hash changes', async () => {
    const hashState = mountHashState()

    window.history.replaceState(null, '', '/builder?mode=edit#tab=history')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await nextTick()

    expect(hashState.state.value).toEqual({ tab: 'history' })
  })

  it('removes the exact hashchange listener when unmounted', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    mountHashState()

    const listener = add.mock.calls.find(([type]) => type === 'hashchange')?.[1]
    expect(listener).toBeDefined()

    mountedInstances.pop()?.unmount()
    expect(remove).toHaveBeenCalledWith('hashchange', listener)
  })
})
