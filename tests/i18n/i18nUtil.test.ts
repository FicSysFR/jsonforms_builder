import { describe, expect, it, vi } from 'vitest'
import { isRef, ref, unref } from 'vue'
import type { Translator } from '@jsonforms/core'
import {
  additionalPropertiesDefaultTranslations,
  AdditionalPropertiesTranslationEnum,
} from '../../src/i18n/additionalPropertiesTranslations'
import { getAdditionalPropertiesTranslations } from '../../src/i18n/i18nUtil'

describe('getAdditionalPropertiesTranslations', () => {
  it('translates ordinary labels immediately with the control label', () => {
    const translator = vi.fn((_key, fallback) => fallback) as Translator
    const translations = getAdditionalPropertiesTranslations(
      translator,
      additionalPropertiesDefaultTranslations,
      'address',
      'Address',
      ref(null),
    )

    expect(translations.addTooltip).toBe('Add to Address')
    expect(translations.removeTooltip).toBe('Delete')
    expect(translator).toHaveBeenCalledWith('address.addTooltip', 'Add to Address', 'Address')
  })

  it('keeps property validation messages reactive', () => {
    const propertyName = ref<string | null>('postalCode')
    const translator = vi.fn((_key, fallback) => fallback) as Translator
    const translations = getAdditionalPropertiesTranslations(
      translator,
      additionalPropertiesDefaultTranslations,
      'address',
      'Address',
      propertyName,
    )
    const invalid = translations[AdditionalPropertiesTranslationEnum.propertyNameInvalid]
    const duplicate = translations[AdditionalPropertiesTranslationEnum.propertyAlreadyDefined]

    expect(isRef(invalid)).toBe(true)
    expect(isRef(duplicate)).toBe(true)
    expect(unref(invalid)).toBe("Property name 'postalCode' is invalid")
    expect(unref(duplicate)).toBe("Property 'postalCode' already defined")

    propertyName.value = 'city'
    expect(unref(invalid)).toBe("Property name 'city' is invalid")
    expect(unref(duplicate)).toBe("Property 'city' already defined")
  })

  it('passes the reactive property name as translator context', () => {
    const propertyName = ref<string | null>(null)
    const translator = vi.fn((_key, _fallback, context) => String(context)) as Translator
    const translations = getAdditionalPropertiesTranslations(
      translator,
      additionalPropertiesDefaultTranslations,
      'object',
      'Object',
      propertyName,
    )

    expect(unref(translations.propertyNameInvalid)).toBe('null')
    propertyName.value = 'invalid name'
    expect(unref(translations.propertyNameInvalid)).toBe('invalid name')
    expect(translator).toHaveBeenLastCalledWith(
      'object.propertyNameInvalid',
      "Property name 'invalid name' is invalid",
      'invalid name',
    )
  })
})
