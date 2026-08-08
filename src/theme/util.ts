import { isObject } from 'radash'
import type { Theme } from './theme'

/**
 * Assembles a template literal into a class string, ignoring
 * falsy interpolations (handy for conditional classes).
 *
 * @example classes`btn ${isPrimary && 'btn--primary'}` // → 'btn btn--primary'
 */
export const classes = (strings: TemplateStringsArray, ...variables: unknown[]) => {
  return strings
    .reduce((acc, curr, index) => {
      const value = variables[index]
      return `${acc}${curr}${value == null || value === false ? '' : String(value)}`
    }, '')
    .trim()
}

/**
 * Recursive merge of two theme fragments, **without mutating the inputs**.
 *
 * When two strings meet they are **concatenated** rather than replaced: that is
 * what we want for Tailwind classes (`'p-2'` + `'bg-red-500'`), whereas a classic
 * merge would drop the first.
 */
const mergeDeep = (a: unknown, b: unknown): unknown => {
  if (typeof a === 'string' && typeof b === 'string') {
    return `${a} ${b}`
  }

  if (isObject(a) && isObject(b)) {
    const source = a as Record<string, unknown>
    const override = b as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const key of new Set([...Object.keys(source), ...Object.keys(override)])) {
      result[key] =
        key in source && key in override
          ? mergeDeep(source[key], override[key])
          : key in override
            ? override[key]
            : source[key]
    }

    return result
  }

  return b === undefined ? a : b
}

export const mergeStyles = (stylesA: Partial<Theme>, stylesB: Partial<Theme>): Partial<Theme> => {
  return mergeDeep(stylesA, stylesB) as Partial<Theme>
}
