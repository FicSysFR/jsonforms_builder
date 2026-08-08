import { ref, watchEffect, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { assign, shake } from 'radash'

export type HashState = Record<string, string | undefined>

export interface UseHashStateResult {
  state: Ref<HashState>
  set: (partial: HashState) => void
}

type WindowLike = {
  location: {
    hash: string
    pathname: string
    search: string
    href: string
    origin: string
  }
  history?: {
    replaceState?: (data: unknown, unused: string, url?: string | null) => void
  }
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
}

/**
 * Obtains a window-like object when running in the browser. Guards against SSR contexts
 * where `globalThis.window` is not defined.
 *
 * @returns {WindowLike | undefined} The detected window replacement or `undefined` when unavailable.
 */
const getRuntimeWindow = (): WindowLike | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined
  }

  const maybeWindow = (globalThis as Record<string, unknown>)?.window as unknown

  if (typeof maybeWindow === 'object' && maybeWindow !== null) {
    const candidate = maybeWindow as Partial<WindowLike>
    if (candidate.location && typeof candidate.location === 'object') {
      return candidate as WindowLike
    }
  }

  return undefined
}

/**
 * Converts the hash fragment string into a plain object of key-value pairs.
 *
 * @param {string} hash - The raw hash string, with or without the leading `#`.
 * @returns {HashState} Parsed key-value mapping representing the hash parameters.
 */
export function parseHash(hash: string): HashState {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  const obj: HashState = {}

  params.forEach((value, key) => {
    obj[key] = value
  })

  return obj
}

/**
 * Serializes a hash state object into a hash fragment string while removing empty values.
 *
 * @param {HashState} obj - The hash state that should be converted back to a string.
 * @returns {string} The normalized hash fragment including the leading `#` when applicable.
 */
export function stringifyHash(obj: HashState): string {
  const params = new URLSearchParams()
  const cleaned = shake(obj)

  for (const [key, value] of Object.entries(cleaned)) {
    params.set(key, value as string)
  }

  const s = params.toString()

  return s ? `#${s}` : ''
}

/**
 * Keeps a reactive record in sync with the location hash while gracefully handling
 * the absence of `window` (e.g., during SSR). Updates to the state reflect in the URL
 * without triggering navigation, and external hash changes hydrate the reactive state.
 *
 * @returns {UseHashStateResult} Wrapper around the reactive hash state and its mutator.
 */
export function useHashState(): UseHashStateResult {
  const state = ref<HashState>({})
  const isHydrated = ref(false)

  const readFromLocation = () => {
    const runtimeWindow = getRuntimeWindow()

    if (!runtimeWindow) {
      return
    }

    const { location } = runtimeWindow
    state.value = parseHash(location.hash || '')
  }

  const writeToLocation = (): void => {
    const runtimeWindow = getRuntimeWindow()

    if (!runtimeWindow) {
      return
    }

    const newHash = stringifyHash(state.value)
    const { location } = runtimeWindow
    const base = `${location.pathname}${location.search}`
    const nextUrl = newHash ? `${base}${newHash}` : base

    if (nextUrl !== location.href.replace(location.origin, '')) {
      runtimeWindow.history?.replaceState?.(null, '', nextUrl)
    }
  }

  const onHashChange = (): void => {
    const runtimeWindow = getRuntimeWindow()

    if (!runtimeWindow) {
      return
    }

    const { location } = runtimeWindow
    state.value = parseHash(location.hash || '')
  }

  onMounted((): void => {
    readFromLocation()
    const runtimeWindow = getRuntimeWindow()

    if (!runtimeWindow) {
      return
    }

    isHydrated.value = true
    runtimeWindow.addEventListener?.('hashchange', onHashChange)
  })

  onBeforeUnmount(() => {
    const runtimeWindow = getRuntimeWindow()

    if (!runtimeWindow) {
      return
    }

    runtimeWindow.removeEventListener?.('hashchange', onHashChange)
  })

  watchEffect(() => {
    if (!isHydrated.value) {
      return
    }

    writeToLocation()
  })

  return {
    state,
    /**
     * Merges partial state updates into the existing hash state and propagates them to the URL.
     *
     * @param {HashState} partial - The subset of keys to update in the hash state.
     */
    set(partial: HashState): void {
      state.value = assign(state.value, partial) as HashState
    },
  }
}
