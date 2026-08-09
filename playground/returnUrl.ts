/**
 * Validates a `?return=` value before navigating away from the builder.
 * Only same-app relative paths are accepted (no open redirects).
 */
export const resolveReturnLocation = (raw: unknown): string => {
  if (typeof raw !== 'string' || raw.length === 0) {
    return '/'
  }

  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return '/'
  }

  const pathOnly = raw.split(/[?#]/, 1)[0] ?? '/'
  if (pathOnly === '/builder' || pathOnly.startsWith('/builder/')) {
    return '/'
  }

  return raw
}
