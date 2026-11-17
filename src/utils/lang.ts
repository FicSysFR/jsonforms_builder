/**
 * Small language helpers, with the exact contracts of the radash 12.1.1 functions the library
 * used. radash has not been published since 2025-06-18; these few lines replace a runtime
 * dependency. Internal: not part of the public API.
 */

export const isArray = Array.isArray

/** Plain object literal (`{}` or `new Object()`), not arrays, class instances or null prototypes. */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && (value as { constructor?: unknown }).constructor === Object

export const isString = (value: unknown): value is string =>
  typeof value === 'string' || value instanceof String

/** A number primitive other than `NaN`. */
export const isNumber = (value: unknown): value is number => {
  try {
    return Number(value) === value
  } catch {
    return false
  }
}

const isDate = (value: unknown): value is Date =>
  Object.prototype.toString.call(value) === '[object Date]'

const isFunction = (value: unknown): boolean =>
  !!(value && (value as { constructor?: unknown; call?: unknown; apply?: unknown }).constructor) &&
  !!(value as { call?: unknown }).call &&
  !!(value as { apply?: unknown }).apply

const isSymbol = (value: unknown): boolean =>
  !!value && (value as { constructor?: unknown }).constructor === Symbol

/**
 * Empty in the radash sense: `null`, `undefined`, booleans, `0`, invalid dates, and strings,
 * arrays, maps, sets or objects without content. Functions and symbols are never empty.
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === true || value === false) return true
  if (value === null || value === undefined) return true
  if (isNumber(value)) return value === 0
  if (isDate(value)) return Number.isNaN(value.getTime())
  if (isFunction(value)) return false
  if (isSymbol(value)) return false
  const length = (value as { length?: unknown }).length
  if (isNumber(length)) return length === 0
  const size = (value as { size?: unknown }).size
  if (isNumber(size)) return size === 0
  return Object.keys(value as object).length === 0
}

/** Reads a dotted / bracketed path (`a.b[0].c`, `a['b']`), or returns `defaultValue`. */
export const get = <T = unknown>(value: unknown, path: string, defaultValue?: T): T => {
  let current = value
  for (const segment of path.split(/[.[\]]/g)) {
    if (current === null || current === undefined) return defaultValue as T
    const key = segment.replace(/['"]/g, '')
    if (key.trim() === '') continue
    current = (current as Record<string, unknown>)[key]
  }
  return (current === undefined ? defaultValue : current) as T
}

/** Deep merge of plain objects: `override` wins, nested plain objects merge recursively. */
export const assign = <X extends Record<string | symbol | number, unknown>>(
  initial: X,
  override: X,
): X => {
  if (!initial || !override) return (initial ?? override ?? {}) as X
  const merged: Record<string, unknown> = {}
  for (const [key, value] of Object.entries({ ...initial, ...override })) {
    merged[key] = isObject(initial[key]) ? assign(initial[key] as X, value as X) : value
  }
  return merged as X
}

/** Copy of `obj` without the keys whose value `filter` matches (by default `undefined`). */
export const shake = <T extends object>(
  obj: T,
  filter: (value: unknown) => boolean = (value) => value === undefined,
): Partial<T> => {
  if (!obj) return {}
  return (Object.keys(obj) as Array<keyof T>).reduce<Partial<T>>((kept, key) => {
    if (!filter(obj[key])) kept[key] = obj[key]
    return kept
  }, {})
}

export type DebouncedFunction<TArgs extends unknown[]> = {
  (...args: TArgs): void
  isPending: () => boolean
  cancel: () => void
  flush: (...args: TArgs) => void
}

/** Runs `func` with the last arguments once `delay` ms passed without a new call. */
export const debounce = <TArgs extends unknown[]>(
  { delay }: { delay: number },
  func: (...args: TArgs) => unknown,
): DebouncedFunction<TArgs> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let active = true
  const debounced = ((...args: TArgs) => {
    if (active) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (active) func(...args)
        timer = undefined
      }, delay)
    } else {
      func(...args)
    }
  }) as DebouncedFunction<TArgs>
  debounced.isPending = () => timer !== undefined
  debounced.cancel = () => {
    active = false
  }
  debounced.flush = (...args: TArgs) => {
    func(...args)
  }
  return debounced
}
