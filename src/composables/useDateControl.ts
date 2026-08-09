import { computed } from 'vue'
import { useUiControl } from '../utils'
import type { useJsonFormsControl } from '@jsonforms/vue'
import { isEmpty } from 'radash'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { ManipulateType } from 'dayjs'
import {
  CalendarDate,
  type CalendarDateTime,
  type DateValue,
  type Time,
  getLocalTimeZone,
  parseDate,
  parseDateTime,
  parseTime,
} from '@internationalized/date'

dayjs.extend(customParseFormat)

type JsonFormsControl = ReturnType<typeof useJsonFormsControl>

type UseDateControlOptions = {
  jsonFormsControl: JsonFormsControl
  clearValue: unknown
  debounceWait?: number
}

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'
export const DEFAULT_TIME_FORMAT = 'HH:mm:ss'

export const countPatternDigits = (pattern: string): number => {
  return pattern.replace(/[^YMDHms]/g, '').length
}

// 3️⃣ normalize entered values for strict comparison with dayjs
export const normalizeDateValue = (value: string, pattern: string): string => {
  if (!value) {
    return value
  }

  if (pattern === DEFAULT_TIME_FORMAT) {
    const segments = value.split(':')
    if (segments.length >= 2) {
      const padded = segments.map((segment, index) => {
        if (segment.length === 0) {
          return segment
        }

        const targetLength = index === 0 ? 2 : 2
        return segment.padStart(targetLength, '0')
      })

      if (padded.length === 2) {
        padded.push('00')
      }

      return padded.slice(0, 3).join(':')
    }

    return value
  }

  if (pattern === DEFAULT_DATE_FORMAT) {
    const segments = value.split('-')
    if (segments.length === 3) {
      const [year, month, day] = segments
      const normalizedYear = year.length === 4 ? year : year.padStart(4, '0')
      const normalizedMonth = month.length === 2 ? month : month.padStart(2, '0')
      const normalizedDay = day.length === 2 ? day : day.padStart(2, '0')

      return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
    }

    return value
  }

  if (pattern === DEFAULT_DATETIME_FORMAT) {
    const [datePart, timePart] = value.split('T')
    if (!timePart) {
      return value
    }

    const normalizedDate = normalizeDateValue(datePart, DEFAULT_DATE_FORMAT)
    const normalizedTime = normalizeDateValue(timePart, DEFAULT_TIME_FORMAT)

    return `${normalizedDate}T${normalizedTime}`
  }

  return value
}

export const resolveDateInputType = (format?: string): 'date' | 'time' | 'datetime-local' => {
  if (format === 'date-time') return 'datetime-local'
  if (format === 'time') return 'time'
  return 'date'
}

export const detectDateUnitFromPosition = (pattern: string, position: number): ManipulateType => {
  // If position exceeds the pattern, use the last valid position
  const safePosition = Math.min(position, pattern.length - 1)

  // Find the format character at or near this position
  let formatChar = pattern[safePosition]

  // If it's a separator, find the nearest format character
  if (![...'YMDHms'].includes(formatChar)) {
    // Search to the left first
    for (let i = safePosition; i >= 0; i--) {
      if ([...'YMDHms'].includes(pattern[i])) {
        formatChar = pattern[i]
        break
      }
    }
    // If not found, search to the right
    if (![...'YMDHms'].includes(formatChar)) {
      for (let i = safePosition; i < pattern.length; i++) {
        if ([...'YMDHms'].includes(pattern[i])) {
          formatChar = pattern[i]
          break
        }
      }
    }
  }

  // Map the format character to the dayjs unit
  switch (formatChar) {
    case 'Y':
      return 'year'
    case 'M':
      return 'month'
    case 'D':
      return 'day'
    case 'H':
      return 'hour'
    case 'm':
      return 'minute'
    case 's':
      return 'second'
    default:
      return 'day' // fallback
  }
}

type DateKeyboardEvent = {
  preventDefault: () => void
  target: {
    selectionStart: number | null | undefined
  }
}

/**
 * `UInputDate` granularity matching a JSON Schema format.
 *
 * `date` → day only; `date-time` → up to the minute, or seconds if the pattern
 * includes them.
 */
export const resolveDateGranularity = (
  format: string | undefined,
  pattern: string,
): 'day' | 'minute' | 'second' => {
  if (format !== 'date-time') {
    return 'day'
  }

  return pattern.includes('s') ? 'second' : 'minute'
}

/**
 * `UCalendar` type derived from the dayjs pattern in the schema / uischema.
 *
 * - `D` present → day selection (`date`)
 * - otherwise `M` → month only (`month`, e.g. `YYYY.MM`)
 * - otherwise `Y` → year only (`year`, e.g. `YYYY`)
 */
export const resolveCalendarType = (pattern: string): 'date' | 'month' | 'year' => {
  if (/D/.test(pattern)) {
    return 'date'
  }

  if (/M/.test(pattern)) {
    return 'month'
  }

  if (/Y/.test(pattern)) {
    return 'year'
  }

  return 'date'
}

/** Declarative bound / exclusion options for `UCalendar` / `UInputDate`. */
export type DateConstraintOptions = {
  /** Inclusive lower bound (`YYYY-MM-DD`, `YYYY-MM`, or `YYYY`). */
  minDate?: string
  /** Inclusive upper bound. */
  maxDate?: string
  /** Excluded days in `YYYY-MM-DD` format. */
  disabledDates?: string[]
  /**
   * Excluded weekdays (`Date#getDay`): `0` = Sunday … `6` = Saturday.
   * E.g. weekend: `[0, 6]`.
   */
  disabledWeekdays?: number[]
  /** Excluded months (`1`–`12`), useful with `calendarType: "month"`. */
  disabledMonths?: number[]
  /** Excluded years, useful with `calendarType: "year"`. */
  disabledYears?: number[]
}

export type DateConstraints = {
  minValue?: CalendarDate
  maxValue?: CalendarDate
  /** Declarative exclusions — wired to `isDateUnavailable` (struck through, more readable). */
  isDateUnavailable?: (date: DateValue) => boolean
  isMonthUnavailable?: (date: DateValue) => boolean
  isYearUnavailable?: (date: DateValue) => boolean
}

const pad2 = (value: number) => String(value).padStart(2, '0')

export const toCalendarDateBound = (value: string | undefined): CalendarDate | undefined => {
  if (!value || typeof value !== 'string') {
    return undefined
  }

  const parsed = dayjs(value, ['YYYY-MM-DD', 'YYYY-MM', 'YYYY.MM', 'YYYY'], true)
  if (parsed.isValid()) {
    return new CalendarDate(parsed.year(), parsed.month() + 1, parsed.date() || 1)
  }

  const loose = dayjs(value)
  if (!loose.isValid()) {
    return undefined
  }

  return new CalendarDate(loose.year(), loose.month() + 1, loose.date() || 1)
}

/**
 * Builds Nuxt UI / reka-ui constraint props from uischema options.
 *
 * Exclusions go through `*Unavailable` (struck through + muted) rather than `*Disabled`
 * (plain `text-muted`): on a range calendar, the enabled / excluded contrast becomes
 * readable. Bounds `minDate` / `maxDate` remain as `minValue` / `maxValue`.
 */
export const buildDateConstraints = (
  options: DateConstraintOptions | undefined,
): DateConstraints => {
  const minValue = toCalendarDateBound(options?.minDate)
  const maxValue = toCalendarDateBound(options?.maxDate)
  const disabledDates = new Set(options?.disabledDates ?? [])
  const disabledWeekdays = options?.disabledWeekdays ?? []
  const disabledMonths = new Set(options?.disabledMonths ?? [])
  const disabledYears = new Set(options?.disabledYears ?? [])

  const hasDayRules = disabledDates.size > 0 || disabledWeekdays.length > 0

  return {
    minValue,
    maxValue,
    isDateUnavailable: hasDayRules
      ? (date: DateValue) => {
          const key = `${date.year}-${pad2(date.month)}-${pad2(date.day)}`
          if (disabledDates.has(key)) {
            return true
          }

          if (disabledWeekdays.length > 0) {
            const jsDay = date.toDate(getLocalTimeZone()).getDay()
            if (disabledWeekdays.includes(jsDay)) {
              return true
            }
          }

          return false
        }
      : undefined,
    isMonthUnavailable:
      disabledMonths.size > 0 ? (date: DateValue) => disabledMonths.has(date.month) : undefined,
    isYearUnavailable:
      disabledYears.size > 0 ? (date: DateValue) => disabledYears.has(date.year) : undefined,
  }
}

/**
 * `ui.cellTrigger` classes to clearly distinguish excluded / out-of-bounds days from
 * the rest of the grid — especially in range mode where `highlighted` styling
 * hides the plain Nuxt UI theme `text-muted`.
 */
export const CALENDAR_CONSTRAINT_CELL_UI =
  'data-disabled:opacity-25 data-disabled:line-through data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-unavailable:opacity-40 data-unavailable:line-through data-unavailable:text-muted data-unavailable:pointer-events-none'

export type DateRangeValue = {
  start?: string
  end?: string
}

export const toDateRangeValue = (
  value: unknown,
  pattern: string,
): { start?: CalendarDate; end?: CalendarDate } => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const range = value as DateRangeValue
  const start = toDateValue(range.start, pattern, 'date')
  const end = toDateValue(range.end, pattern, 'date')

  return {
    start:
      start && 'year' in start ? new CalendarDate(start.year, start.month, start.day) : undefined,
    end: end && 'year' in end ? new CalendarDate(end.year, end.month, end.day) : undefined,
  }
}

export const fromDateRangeValue = (
  value:
    | {
        start?: Pick<DateValue, 'year' | 'month' | 'day'> | null
        end?: Pick<DateValue, 'year' | 'month' | 'day'> | null
      }
    | null
    | undefined,
  pattern: string,
): DateRangeValue | undefined => {
  if (!value?.start) {
    return undefined
  }

  const start = fromDateValue(
    new CalendarDate(value.start.year, value.start.month, value.start.day),
    pattern,
    'date',
  )
  const end = value.end
    ? fromDateValue(
        new CalendarDate(value.end.year, value.end.month, value.end.day),
        pattern,
        'date',
      )
    : undefined

  return { start, end }
}

/**
 * Converts the stored value (string in the schema pattern) to the object expected by
 * `UInputDate` / `UInputTime`, which work with `@internationalized/date`.
 *
 * Returns `undefined` if the value is missing or not parseable — the field then
 * displays empty rather than throwing.
 */
export const toDateValue = (
  value: unknown,
  pattern: string,
  format: string | undefined,
): CalendarDate | CalendarDateTime | Time | undefined => {
  if (isEmpty(value) || typeof value !== 'string') {
    return undefined
  }

  const parsed = dayjs(value, pattern, true)
  if (!parsed.isValid()) {
    return undefined
  }

  try {
    if (format === 'time') {
      return parseTime(parsed.format(DEFAULT_TIME_FORMAT))
    }

    if (format === 'date-time') {
      return parseDateTime(parsed.format(DEFAULT_DATETIME_FORMAT))
    }

    return parseDate(parsed.format(DEFAULT_DATE_FORMAT))
  } catch {
    return undefined
  }
}

/**
 * Return path: component object back to a string in the pattern expected by the schema.
 */
export const fromDateValue = (
  value: CalendarDate | CalendarDateTime | Time | null | undefined,
  pattern: string,
  format: string | undefined,
): string | undefined => {
  if (!value) {
    return undefined
  }

  const iso = value.toString()
  const sourcePattern =
    format === 'time'
      ? DEFAULT_TIME_FORMAT
      : format === 'date-time'
        ? DEFAULT_DATETIME_FORMAT
        : DEFAULT_DATE_FORMAT

  // `Time` serializes as `HH:mm:ss[.SSS]`: truncate to seconds before reparsing.
  const normalized = format === 'time' ? iso.slice(0, 8) : iso
  const parsed = dayjs(normalized, sourcePattern, false)

  return parsed.isValid() ? parsed.format(pattern) : undefined
}

export const useDateControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait = 100,
}: UseDateControlOptions) => {
  const adaptTarget = (value: unknown) => (isEmpty(value) ? clearValue : value)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const rawFormat = computed(
    () =>
      control.control.value.schema?.format ??
      control.control.value.uischema?.options?.format ??
      'date',
  )

  const patternDefault = computed(() => {
    if (rawFormat.value === 'date-time') return DEFAULT_DATETIME_FORMAT
    if (rawFormat.value === 'time') return DEFAULT_TIME_FORMAT
    return DEFAULT_DATE_FORMAT
  })

  const optionPattern = computed(
    () => control.appliedOptions.value?.pattern || patternDefault.value,
  )

  const controlData = computed(() => {
    const date = dayjs(control.control.value.data, optionPattern.value, true)

    return date.format(patternDefault.value)
  })

  const maskPattern = computed(() => {
    const pattern = optionPattern.value

    return pattern.replace(/Y|M|D|H|m|s/g, '#')
  })

  const inputType = computed(() => resolveDateInputType(rawFormat.value))

  const granularity = computed(() => resolveDateGranularity(rawFormat.value, optionPattern.value))

  const calendarType = computed(() => resolveCalendarType(String(optionPattern.value ?? '')))

  const dateConstraints = computed(() =>
    buildDateConstraints(control.appliedOptions.value as DateConstraintOptions | undefined),
  )

  /** Value exposed to `UInputDate` / `UInputTime`. */
  const dateValue = computed(() =>
    toDateValue(control.control.value.data, optionPattern.value, rawFormat.value),
  )

  /** Component return: convert back to a schema-pattern string before propagating. */
  const onChangeDateValue = (value: CalendarDate | CalendarDateTime | Time | null | undefined) => {
    control.onChange(adaptTarget(fromDateValue(value, optionPattern.value, rawFormat.value)))
  }

  const normalizeValue = (value: string, pattern = patternDefault.value) => {
    return normalizeDateValue(value, pattern)
  }

  const onBlur = () => {
    control.isFocused.value = false
    control.touched.value = true

    const normalized = normalizeValue(controlData.value)
    const date = dayjs(normalized, patternDefault.value, true)

    // Partial input left as-is on blur is cleared rather than kept invalid.
    if (!date.isValid()) {
      control.onChange(adaptTarget(undefined))
    }
  }

  const onChangeDate = (value: string) => {
    // 1️⃣ Clear case: user empties the field -> propagate the empty value
    if (isEmpty(value)) {
      // adaptTarget turns "" into clearValue (null, undefined, whatever you configured)
      control.onChange(adaptTarget(value))
      return
    }

    // 2️⃣ While input has not filled the pattern (mask), do NOTHING
    //    -> prevents "13:" or "13:5" from triggering normalization to "13:00"
    const neededDigits = countPatternDigits(optionPattern.value)
    const currentDigits = value.replace(/\D/g, '').length

    if (currentDigits < neededDigits) {
      return
    }

    // 3️⃣ Only then normalize / parse / format
    const normalized = normalizeValue(value)
    const date = dayjs(normalized, optionPattern.value, true)

    if (!date.isValid()) {
      return
    }

    control.onChange(date.format(optionPattern.value))
  }

  const changeValueAtPosition = (increment: number, cursorPosition: number) => {
    const currentDate = dayjs(control.control.value.data, optionPattern.value, true)

    if (!currentDate.isValid()) {
      // If no valid date, use the current date
      const date = dayjs()
      control.onChange(date.format(optionPattern.value))
      return
    }

    // Detect which date part to change based on cursor position
    const dateUnit = detectDateUnitFromPosition(optionPattern.value, cursorPosition)
    const newDate = currentDate.add(increment, dateUnit)

    control.onChange(newDate.format(optionPattern.value))
  }

  /** Suppress keydown so only keyup increments (avoids double step on repeat). */
  const keydownHandler = (ev: DateKeyboardEvent) => {
    ev.preventDefault()
  }

  /** ↑ / ↓ increment the date segment under the cursor. */
  const keyupHandler = (ev: DateKeyboardEvent, pos: number) => {
    ev.preventDefault()
    changeValueAtPosition(pos, ev.target.selectionStart ?? 0)
  }

  return {
    ...control,
    adaptTarget,
    granularity,
    calendarType,
    dateConstraints,
    dateValue,
    onChangeDateValue,
    optionPattern,
    controlData,
    maskPattern,
    inputType,
    patternDefault,
    normalizeValue,
    onBlur,
    onChangeDate,
    keydownHandler,
    keyupHandler,
    changeValueAtPosition,
    getDateUnitFromPosition: (position: number) =>
      detectDateUnitFromPosition(optionPattern.value, position),
  }
}
