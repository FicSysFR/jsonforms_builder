import { describe, expect, it } from 'vitest'
import { CalendarDate, CalendarDateTime } from '@internationalized/date'
import {
  buildDateConstraints,
  fromDateRangeValue,
  fromDateValue,
  isIncompleteTypedYear,
  resolveCalendarType,
  resolveDateGranularity,
  toCalendarDateBound,
  toDateRangeValue,
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

describe('resolveCalendarType', () => {
  it('picks a day calendar when the pattern includes a day token', () => {
    expect(resolveCalendarType(DEFAULT_DATE_FORMAT)).toBe('date')
    expect(resolveCalendarType('YYYY-MM-DDTHH:mm')).toBe('date')
  })

  it('falls back to month or year when the pattern omits the day', () => {
    expect(resolveCalendarType('YYYY.MM')).toBe('month')
    expect(resolveCalendarType('YYYY-MM')).toBe('month')
    expect(resolveCalendarType('YYYY')).toBe('year')
  })
})

describe('buildDateConstraints', () => {
  it('parses min/max bounds from ISO-like strings', () => {
    const constraints = buildDateConstraints({
      minDate: '2026-01-01',
      maxDate: '2026-12-31',
    })

    expect(constraints.minValue?.toString()).toBe('2026-01-01')
    expect(constraints.maxValue?.toString()).toBe('2026-12-31')
    expect(constraints.isDateUnavailable).toBeUndefined()
  })

  it('disables listed dates and weekdays', () => {
    const constraints = buildDateConstraints({
      disabledDates: ['2026-08-15'],
      disabledWeekdays: [0, 6],
    })

    expect(constraints.isDateUnavailable?.(new CalendarDate(2026, 8, 15))).toBe(true)
    // 2026-08-10 = lundi
    expect(constraints.isDateUnavailable?.(new CalendarDate(2026, 8, 10))).toBe(false)
    // 2026-08-09 = dimanche
    expect(constraints.isDateUnavailable?.(new CalendarDate(2026, 8, 9))).toBe(true)
    // 2026-08-08 = samedi
    expect(constraints.isDateUnavailable?.(new CalendarDate(2026, 8, 8))).toBe(true)
  })

  it('disables months and years for coarser pickers', () => {
    const constraints = buildDateConstraints({
      disabledMonths: [1, 2],
      disabledYears: [2020, 2021],
    })

    expect(constraints.isMonthUnavailable?.(new CalendarDate(2026, 1, 1))).toBe(true)
    expect(constraints.isMonthUnavailable?.(new CalendarDate(2026, 3, 1))).toBe(false)
    expect(constraints.isYearUnavailable?.(new CalendarDate(2020, 6, 1))).toBe(true)
    expect(constraints.isYearUnavailable?.(new CalendarDate(2026, 6, 1))).toBe(false)
  })
})

describe('toCalendarDateBound', () => {
  it('accepts year-month and year-only bounds', () => {
    expect(toCalendarDateBound('2026.08')?.toString()).toBe('2026-08-01')
    expect(toCalendarDateBound('2026')?.toString()).toBe('2026-01-01')
  })
})

describe('date range conversion', () => {
  it('round-trips a start/end pair', () => {
    const range = toDateRangeValue({ start: '2026-08-01', end: '2026-08-10' }, DEFAULT_DATE_FORMAT)

    expect(range.start?.toString()).toBe('2026-08-01')
    expect(range.end?.toString()).toBe('2026-08-10')
    expect(fromDateRangeValue(range, DEFAULT_DATE_FORMAT)).toEqual({
      start: '2026-08-01',
      end: '2026-08-10',
    })
  })

  it('returns undefined when the range has no start', () => {
    expect(fromDateRangeValue(null, DEFAULT_DATE_FORMAT)).toBeUndefined()
    expect(fromDateRangeValue({ start: undefined }, DEFAULT_DATE_FORMAT)).toBeUndefined()
  })
})

describe('toDateValue', () => {
  it('parses dates, times and datetimes at their schema pattern', () => {
    expect(toDateValue('1985-06-02', DEFAULT_DATE_FORMAT, 'date')?.toString()).toBe('1985-06-02')
    expect(toDateValue('13:37:00', DEFAULT_TIME_FORMAT, 'time')?.toString()).toMatch(/^13:37/)
    expect(
      toDateValue('1999-12-11T10:05:00', DEFAULT_DATETIME_FORMAT, 'date-time')?.toString(),
    ).toMatch(/^1999-12-11T10:05/)
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
    expect(fromDateValue(datetime, DEFAULT_DATETIME_FORMAT, 'date-time')).toBe(
      '1999-12-11T10:05:00',
    )
  })

  it('preserves years below 100 instead of remapping them to 19xx', () => {
    // Regression: dayjs(CalendarDate.toString()) turned 0001-01-01 into 1901-01-01.
    expect(fromDateValue(new CalendarDate(1, 1, 1), 'YYYY', 'date')).toBe('0001')
    expect(fromDateValue(new CalendarDate(2, 6, 15), DEFAULT_DATE_FORMAT, 'date')).toBe(
      '0002-06-15',
    )
    expect(
      fromDateValue(
        new CalendarDateTime(99, 12, 31, 23, 59, 58),
        DEFAULT_DATETIME_FORMAT,
        'date-time',
      ),
    ).toBe('0099-12-31T23:59:58')
  })

  it('returns undefined when there is no value to convert', () => {
    expect(fromDateValue(null, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
    expect(fromDateValue(undefined, DEFAULT_DATE_FORMAT, 'date')).toBeUndefined()
  })
})

describe('isIncompleteTypedYear', () => {
  it('flags 1–3 digit years emitted while typing in DateField', () => {
    expect(isIncompleteTypedYear(1)).toBe(true)
    expect(isIncompleteTypedYear(20)).toBe(true)
    expect(isIncompleteTypedYear(202)).toBe(true)
    expect(isIncompleteTypedYear(1000)).toBe(false)
    expect(isIncompleteTypedYear(2024)).toBe(false)
  })
})
