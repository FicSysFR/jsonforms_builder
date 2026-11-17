import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assign,
  debounce,
  get,
  isArray,
  isEmpty,
  isNumber,
  isObject,
  isString,
  shake,
} from '../../src/utils/lang'

afterEach(() => vi.useRealTimers())

// Same contracts as the radash 12.1.1 helpers they replace: the library behaves identically.
describe('lang helpers', () => {
  it('get reads dotted and bracketed paths with a fallback', () => {
    const value = { a: { b: [{ c: 1 }], n: null } }
    expect(get(value, 'a.b[0].c')).toBe(1)
    expect(get(value, "a['b'][0].c")).toBe(1)
    expect(get(value, 'a.x', 'fallback')).toBe('fallback')
    expect(get(value, 'a.n.y', 'fallback')).toBe('fallback')
    expect(get(value, 'a.n')).toBeNull()
    expect(get(undefined, 'a', 2)).toBe(2)
  })

  it('isEmpty follows radash, booleans and zero included', () => {
    for (const empty of [null, undefined, true, false, 0, '', [], {}, new Map(), new Set()]) {
      expect(isEmpty(empty), String(empty)).toBe(true)
    }
    for (const full of [1, 'a', [0], { a: 1 }, new Map([[1, 1]]), () => 0, Symbol('s')]) {
      expect(isEmpty(full), String(full)).toBe(false)
    }
    expect(isEmpty(new Date('invalid'))).toBe(true)
    expect(isEmpty(new Date(0))).toBe(false)
  })

  it('type guards match radash', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(Object.create(null))).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isString('a')).toBe(true)
    expect(isString(new String('a'))).toBe(true)
    expect(isNumber(1.5)).toBe(true)
    expect(isNumber(Number.NaN)).toBe(false)
    expect(isNumber('1')).toBe(false)
    expect(isArray([])).toBe(true)
  })

  it('assign merges plain objects deeply and shake drops undefined values', () => {
    expect(assign({ a: { x: 1, y: 2 }, b: 1 }, { a: { y: 3 }, c: 4 })).toEqual({
      a: { x: 1, y: 3 },
      b: 1,
      c: 4,
    })
    expect(assign(undefined as never, { a: 1 })).toEqual({ a: 1 })
    expect(shake({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null })
    expect(shake(undefined as never)).toEqual({})
  })

  it('debounce runs the last call after the delay', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const debounced = debounce({ delay: 50 }, spy)
    debounced(1)
    debounced(2)
    expect(debounced.isPending()).toBe(true)
    await vi.advanceTimersByTimeAsync(50)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(2)
    expect(debounced.isPending()).toBe(false)
  })
})
