import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope } from 'vue'
import {
  countPatternDigits,
  normalizeDateValue,
  resolveDateInputType,
  detectDateUnitFromPosition,
  useDateControl,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_DATETIME_FORMAT,
} from '../../src/composables/useDateControl'
import { mountControl } from '../helpers/controlHarness'

afterEach(() => {
  vi.useRealTimers()
})

describe('useDateControl', () => {
  it('falls back to the schema default when options.pattern is not a string', () => {
    const app = createApp({})
    const scope = effectScope()
    let control: ReturnType<typeof useDateControl> | undefined

    app.runWithContext(() => {
      scope.run(() => {
        control = useDateControl({
          jsonFormsControl: {
            control: computed(() => ({
              schema: { type: 'string', format: 'date' },
              uischema: {
                type: 'Control',
                scope: '#/properties/date',
                options: { pattern: 42 },
              },
              path: 'date',
              config: {},
              label: 'Date',
              description: '',
              required: false,
              enabled: true,
              errors: '',
              data: '2026-09-08',
              id: '#/properties/date',
              visible: true,
            })),
            handleChange: () => undefined,
          } as never,
          clearValue: undefined,
        })
      })
    })

    expect(control?.optionPattern.value).toBe(DEFAULT_DATE_FORMAT)
    scope.stop()
  })

  it('emits only complete valid values and clears invalid input on blur', () => {
    vi.useFakeTimers()
    const mounted = mountControl(
      (jsonFormsControl) => useDateControl({ jsonFormsControl, clearValue: null, debounceWait: 0 }),
      {
        schema: { type: 'string', format: 'date' },
        data: '2026-09-08',
      },
    )

    expect(mounted.result.inputType.value).toBe('date')
    expect(mounted.result.maskPattern.value).toBe('####-##-##')
    expect(mounted.result.dateValue.value?.toString()).toBe('2026-09-08')

    mounted.result.onChangeDate('2026-09')
    vi.runAllTimers()
    expect(mounted.handleChange).not.toHaveBeenCalled()

    mounted.result.onChangeDate('2026-09-10')
    vi.runAllTimers()
    expect(mounted.handleChange).toHaveBeenLastCalledWith('value', '2026-09-10')

    mounted.state.value.data = 'invalid'
    mounted.result.onBlur()
    vi.runAllTimers()
    expect(mounted.handleChange).toHaveBeenLastCalledWith('value', null)
    expect(mounted.result.touched.value).toBe(true)
    mounted.stop()
  })
})

describe('countPatternDigits', () => {
  it('counts date pattern tokens', () => {
    expect(countPatternDigits('YYYY-MM-DD')).toBe(8)
    expect(countPatternDigits('HH:mm:ss')).toBe(6)
  })
})

describe('normalizeDateValue', () => {
  it('pads time segments and adds seconds', () => {
    expect(normalizeDateValue('8:5', DEFAULT_TIME_FORMAT)).toBe('08:05:00')
  })

  it('pads date segments', () => {
    expect(normalizeDateValue('2024-1-7', DEFAULT_DATE_FORMAT)).toBe('2024-01-07')
  })

  it('normalizes datetime recursively', () => {
    expect(normalizeDateValue('2024-1-7T8:5', DEFAULT_DATETIME_FORMAT)).toBe('2024-01-07T08:05:00')
  })
})

describe('resolveDateInputType', () => {
  it('maps schema format to input type', () => {
    expect(resolveDateInputType('date-time')).toBe('datetime-local')
    expect(resolveDateInputType('time')).toBe('time')
    expect(resolveDateInputType('date')).toBe('date')
    expect(resolveDateInputType(undefined)).toBe('date')
  })
})

describe('detectDateUnitFromPosition', () => {
  it('detects unit based on pattern position', () => {
    expect(detectDateUnitFromPosition('YYYY-MM-DD', 0)).toBe('year')
    expect(detectDateUnitFromPosition('YYYY-MM-DD', 5)).toBe('month')
    expect(detectDateUnitFromPosition('YYYY-MM-DD', 8)).toBe('day')
  })
})
