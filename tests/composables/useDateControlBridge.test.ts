import { describe, expect, it } from 'bun:test'
import {
  fromDateValue,
  resolveDateGranularity,
  toDateValue,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATETIME_FORMAT,
  DEFAULT_TIME_FORMAT,
} from '../../src/composables/useDateControl'

describe('resolveDateGranularity', () => {
  it('stays on the day for plain dates', () => {
    expect(resolveDateGranularity('date', DEFAULT_DATE_FORMAT)).toBe('day')
    expect(resolveDateGranularity(undefined, DEFAULT_DATE_FORMAT)).toBe('day')
  })

  it('goes down to the second only when the pattern asks for it', () => {
    expect(resolveDateGranularity('date-time', 'YYYY-MM-DDTHH:mm')).toBe('minute')
    expect(resolveDateGranularity('date-time', DEFAULT_DATETIME_FORMAT)).toBe('second')
  })
})

describe('toDateValue', () => {
  it('parses dates, times and datetimes at their schema pattern', () => {
    expect(toDateValue('1985-06-02', DEFAULT_DATE_FORMAT, 'date')?.toString()).toBe('1985-06-02')
    expect(toDateValue('13:37:00', DEFAULT_TIME_FORMAT, 'time')?.toString()).toStartWith('13:37')
    expect(
      toDateValue('1999-12-11T10:05:00', DEFAULT_DATETIME_FORMAT, 'date-time')?.toString(),
    ).toStartWith('1999-12-11T10:05')
  })

  it('honours a custom uischema pattern', () => {
    expect(toDateValue('2024.01', 'YYYY.MM', 'date')?.toString()).toBe('2024-01-01')
  })

  it('returns undefined for empty or unparsable values instead of throwing', () => {
    expect(toDateValue('', DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
    expect(toDateValue(undefined, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
    expect(toDateValue('not-a-date', DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
    expect(toDateValue(42, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
  })
})

describe('fromDateValue', () => {
  it('round-trips a date back to the schema pattern', () => {
    const value = toDateValue('1985-06-02', DEFAULT_DATE_FORMAT, 'date')

    expect(fromDateValue(value, DEFAULT_DATE_FORMAT, 'date')).toBe('1985-06-02')
  })

  it('round-trips through a custom pattern without losing it', () => {
    const value = toDateValue('2024.01', 'YYYY.MM', 'date')

    expect(fromDateValue(value, 'YYYY.MM', 'date')).toBe('2024.01')
  })

  it('round-trips times and datetimes', () => {
    const time = toDateValue('13:37:00', DEFAULT_TIME_FORMAT, 'time')
    expect(fromDateValue(time, DEFAULT_TIME_FORMAT, 'time')).toBe('13:37:00')

    const datetime = toDateValue('1999-12-11T10:05:00', DEFAULT_DATETIME_FORMAT, 'date-time')
    expect(fromDateValue(datetime, DEFAULT_DATETIME_FORMAT, 'date-time')).toBe('1999-12-11T10:05:00')
  })

  it('returns undefined when there is no value to convert', () => {
    expect(fromDateValue(null, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
    expect(fromDateValue(undefined, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
  })
})
