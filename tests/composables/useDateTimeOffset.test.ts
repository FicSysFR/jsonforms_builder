import { CalendarDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import {
  resolveLocalOffset,
  splitDateTimeOffset,
  useDateControl,
} from '../../src/composables/useDateControl'
import { mountControl } from '../helpers/controlHarness'

const flush = () => new Promise((resolve) => setTimeout(resolve, 5))

const mountDateTime = (data: unknown, options: Record<string, unknown> = {}) =>
  mountControl(
    (jsonFormsControl) =>
      useDateControl({ jsonFormsControl, clearValue: undefined, debounceWait: 0 }),
    {
      schema: { type: 'string', format: 'date-time' },
      uischema: { type: 'Control', scope: '#/properties/value', options },
      data,
    },
  )

describe('splitDateTimeOffset', () => {
  it('separates the wall time from an RFC 3339 offset', () => {
    expect(splitDateTimeOffset('2026-11-17T10:30:00+05:30')).toEqual({
      local: '2026-11-17T10:30:00',
      offset: '+05:30',
    })
    expect(splitDateTimeOffset('2026-11-17t09:00:00.123z')).toEqual({
      local: '2026-11-17T09:00:00',
      offset: 'Z',
    })
    expect(splitDateTimeOffset('2026-11-17T09:00-0300')).toEqual({
      local: '2026-11-17T09:00:00',
      offset: '-03:00',
    })
  })

  it('leaves naive values and non date-times untouched', () => {
    expect(splitDateTimeOffset('2026-11-17T10:30:00')).toEqual({ local: '2026-11-17T10:30:00' })
    expect(splitDateTimeOffset('17/11/2026')).toEqual({ local: '17/11/2026' })
  })
})

describe('resolveLocalOffset', () => {
  it('follows the time zone rules at that wall time', () => {
    const winter = new CalendarDateTime(2026, 1, 15, 12, 0, 0)
    const summer = new CalendarDateTime(2026, 7, 15, 12, 0, 0)
    expect(resolveLocalOffset(winter, 'Europe/Paris')).toBe('+01:00')
    expect(resolveLocalOffset(summer, 'Europe/Paris')).toBe('+02:00')
    expect(resolveLocalOffset(summer, 'America/St_Johns')).toBe('-02:30')
    expect(resolveLocalOffset(winter, 'UTC')).toBe('+00:00')
  })
})

describe('date-time control with an offset', () => {
  it('shows the wall time of the stored offset', () => {
    const mounted = mountDateTime('2026-11-17T10:30:00+05:30')
    expect(String(mounted.result.dateValue.value)).toBe('2026-11-17T10:30:00')
    expect(mounted.result.dateTimeOffset.value).toBe('+05:30')
    mounted.stop()
  })

  it('writes an edit back with the stored offset', async () => {
    const mounted = mountDateTime('2026-11-17T10:30:00+05:30')
    mounted.result.onChangeDateValue(new CalendarDateTime(2026, 11, 18, 11, 0, 0))
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '2026-11-18T11:00:00+05:30')
    mounted.stop()
  })

  it('keeps UTC values in UTC', async () => {
    const mounted = mountDateTime('2026-11-17T09:00:00Z')
    expect(String(mounted.result.dateValue.value)).toBe('2026-11-17T09:00:00')
    mounted.result.onChangeDateValue(new CalendarDateTime(2026, 11, 17, 9, 15, 0))
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '2026-11-17T09:15:00Z')
    mounted.stop()
  })

  it('keeps a naive legacy value naive', async () => {
    const mounted = mountDateTime('2026-11-17T10:30:00')
    expect(mounted.result.dateTimeOffset.value).toBeUndefined()
    mounted.result.onChangeDateValue(new CalendarDateTime(2026, 11, 17, 11, 0, 0))
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '2026-11-17T11:00:00')
    mounted.stop()
  })

  it('stamps a new value with the local offset of its wall time', async () => {
    const mounted = mountDateTime(undefined)
    const value = new CalendarDateTime(2026, 7, 1, 8, 0, 0)
    mounted.result.onChangeDateValue(value)
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith(
      'value',
      `2026-07-01T08:00:00${resolveLocalOffset(value)}`,
    )
    mounted.stop()
  })

  it("writes naive new values with options.dateTimeOffset: 'none'", async () => {
    const mounted = mountDateTime(undefined, { dateTimeOffset: 'none' })
    mounted.result.onChangeDateValue(new CalendarDateTime(2026, 7, 1, 8, 0, 0))
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '2026-07-01T08:00:00')
    mounted.stop()
  })

  it('leaves a custom pattern in charge of the format', async () => {
    const mounted = mountDateTime('17/11/2026 10:30', { pattern: 'DD/MM/YYYY HH:mm' })
    expect(mounted.result.dateTimeOffset.value).toBeUndefined()
    mounted.result.onChangeDateValue(new CalendarDateTime(2026, 11, 17, 11, 0, 0))
    await flush()
    expect(mounted.handleChange).toHaveBeenCalledWith('value', '17/11/2026 11:00')
    mounted.stop()
  })

  it('does not treat an offset value as partial input on blur', async () => {
    const mounted = mountDateTime('2026-11-17T10:30:00+05:30')
    mounted.result.onBlur()
    await flush()
    expect(mounted.handleChange).not.toHaveBeenCalled()
    mounted.stop()
  })
})
