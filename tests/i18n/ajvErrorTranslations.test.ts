import { describe, expect, it } from 'vitest'
import { defaultErrorTranslator } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import {
  createJsonFormsTranslator,
  getAjvErrorTranslations,
  interpolateAjvErrorMessage,
  normalizeAjvErrorLocale,
} from '../../src/i18n'

const error = (keyword: string, params: Record<string, unknown> = {}, message = 'raw'): ErrorObject =>
  ({
    keyword,
    message,
    params,
    instancePath: '/name',
    schemaPath: '#/properties/name',
    parentSchema: { type: 'string' },
  }) as ErrorObject

describe('normalizeAjvErrorLocale', () => {
  it('maps fr / fr-FR to fr and everything else to en', () => {
    expect(normalizeAjvErrorLocale('fr')).toBe('fr')
    expect(normalizeAjvErrorLocale('fr-FR')).toBe('fr')
    expect(normalizeAjvErrorLocale('en')).toBe('en')
    expect(normalizeAjvErrorLocale('de')).toBe('en')
    expect(normalizeAjvErrorLocale(undefined)).toBe('en')
  })
})

describe('interpolateAjvErrorMessage', () => {
  it('fills {{param}} from error.params', () => {
    expect(
      interpolateAjvErrorMessage('min {{limit}}', {
        error: { params: { limit: 3 } },
      }),
    ).toBe('min 3')
  })

  it('joins array params', () => {
    expect(
      interpolateAjvErrorMessage('types {{type}}', {
        error: { params: { type: ['string', 'null'] } },
      }),
    ).toBe('types string, null')
  })
})

describe('createJsonFormsTranslator', () => {
  it('returns French AJV messages for error.<keyword>', () => {
    const t = createJsonFormsTranslator({ locale: 'fr' })
    expect(t('error.minLength', undefined, { error: error('minLength', { limit: 5 }) })).toBe(
      'doit contenir au moins 5 caractère(s)',
    )
    expect(t('error.format', undefined, { error: error('format', { format: 'email' }) })).toBe(
      'doit correspondre au format « email »',
    )
    expect(t('is a required property', 'is a required property')).toBe(
      'est une propriété obligatoire',
    )
  })

  it('returns English AJV messages by default', () => {
    const t = createJsonFormsTranslator({ locale: 'en' })
    expect(t('error.maxLength', undefined, { error: error('maxLength', { limit: 10 }) })).toBe(
      'must NOT have more than 10 characters',
    )
  })

  it('prefers app messages over built-in AJV errors', () => {
    const t = createJsonFormsTranslator({
      locale: 'fr',
      messages: { error: { minLength: 'Trop court ({{limit}})' } },
    })
    expect(t('error.minLength', undefined, { error: error('minLength', { limit: 2 }) })).toBe(
      'Trop court (2)',
    )
  })

  it('returns undefined when missing so JSON Forms can fall through', () => {
    const t = createJsonFormsTranslator({ locale: 'fr', messages: {} })
    expect(t('name.error.custom', undefined)).toBeUndefined()
    expect(t('name.label', 'Name')).toBe('Name')
  })

  it('resolves nested example keys', () => {
    const t = createJsonFormsTranslator({
      locale: 'fr',
      messages: { name: { label: 'Nom' } },
    })
    expect(t('name.label', 'Name')).toBe('Nom')
  })
})

describe('defaultErrorTranslator + createJsonFormsTranslator', () => {
  it('localizes via the default JSON Forms error chain', () => {
    const t = createJsonFormsTranslator({ locale: 'fr' })
    const message = defaultErrorTranslator(error('minLength', { limit: 8 }, 'must NOT…'), t)
    expect(message).toBe('doit contenir au moins 8 caractère(s)')
  })

  it('localizes required rewrite key', () => {
    const t = createJsonFormsTranslator({ locale: 'fr' })
    const message = defaultErrorTranslator(
      error('required', { missingProperty: 'name' }, 'must have required property \'name\''),
      t,
    )
    expect(message).toBe('est une propriété obligatoire')
  })
})

describe('getAjvErrorTranslations', () => {
  it('exposes error.type for fr and en', () => {
    expect(getAjvErrorTranslations('fr').error.type).toContain('{{type}}')
    expect(getAjvErrorTranslations('en').error.type).toContain('{{type}}')
  })
})
