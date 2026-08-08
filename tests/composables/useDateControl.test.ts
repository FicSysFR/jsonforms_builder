import { describe, expect, it } from 'vitest'
import {
    countPatternDigits,
    normalizeDateValue,
    resolveDateInputType,
    detectDateUnitFromPosition,
    DEFAULT_DATE_FORMAT,
    DEFAULT_TIME_FORMAT,
    DEFAULT_DATETIME_FORMAT,
} from '../../src/composables/useDateControl'

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
