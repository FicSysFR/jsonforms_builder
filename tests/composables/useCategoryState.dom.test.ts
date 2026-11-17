// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { useCategoryState } from '../../src/composables/useHashState'

const apps: Array<ReturnType<typeof createApp>> = []

const mountCategoryState = (urlHash: boolean) => {
  let result: ReturnType<typeof useCategoryState> | undefined
  const app = createApp(
    defineComponent({
      setup() {
        result = useCategoryState(urlHash)
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  apps.push(app)
  if (!result) throw new Error('state not initialized')
  return result
}

beforeEach(() => {
  window.history.replaceState(null, '', '/page#/route?x=1')
})

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
})

describe('useCategoryState', () => {
  it('keeps the active category in memory and never touches the URL by default', async () => {
    const { state, set } = mountCategoryState(false)
    set({ tab: 'advanced' })
    await nextTick()

    expect(state.value.tab).toBe('advanced')
    expect(window.location.hash).toBe('#/route?x=1')
  })

  it('ignores the URL hash on mount by default', () => {
    window.history.replaceState(null, '', '/page#tab=advanced')
    const { state } = mountCategoryState(false)
    expect(state.value.tab).toBeUndefined()
  })

  it('syncs with location.hash when the host opts in', async () => {
    window.history.replaceState(null, '', '/page#tab=basic')
    const { state, set } = mountCategoryState(true)
    expect(state.value.tab).toBe('basic')

    set({ tab: 'advanced' })
    await nextTick()
    expect(window.location.hash).toBe('#tab=advanced')
  })
})
