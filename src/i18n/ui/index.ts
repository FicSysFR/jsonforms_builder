import type { JsonFormsSubStates, Translator } from '@jsonforms/core'
import { type InjectionKey, inject } from 'vue'
import { advancedUiMessages } from './advanced'
import { builderUiMessages } from './builder'
import { coreUiMessages } from './core'

/**
 * Every interface text of the library (renderers, WYSIWYG, builder), in French and English.
 * Pure data: importing it never pulls a renderer.
 */
export const UI_MESSAGES = {
  fr: { ...coreUiMessages.fr, ...advancedUiMessages.fr, ...builderUiMessages.fr },
  en: { ...coreUiMessages.en, ...advancedUiMessages.en, ...builderUiMessages.en },
} as const

export type UiLocale = keyof typeof UI_MESSAGES
export type UiMessageKey = keyof (typeof UI_MESSAGES)['fr']
export type UiMessageValues = Record<string, string | number>

/** `fr` for any French locale (`fr`, `fr-FR`, `fr_CA`…), `en` otherwise. */
export const normalizeUiLocale = (locale: string): UiLocale =>
  locale.toLowerCase().split(/[_-]/)[0] === 'fr' ? 'fr' : 'en'

export const getUiTranslations = (locale: string): Readonly<Record<string, string>> =>
  UI_MESSAGES[normalizeUiLocale(locale)]

export const formatUiMessage = (template: string, values?: UiMessageValues): string =>
  values
    ? template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
        name in values ? String(values[name]) : match,
      )
    : template

export type UiText = (key: UiMessageKey, values?: UiMessageValues) => string

/**
 * Text resolver: asks `translate` (a JSON Forms translator, for instance the one of
 * `createJsonFormsTranslator({ locale })` or a vue-i18n bridge) and falls back to the French
 * catalog, the historical texts.
 */
export const createUiText =
  (translate?: Translator): UiText =>
  (key, values) => {
    const translated = translate?.(key, undefined, values)
    return formatUiMessage(
      typeof translated === 'string' ? translated : UI_MESSAGES.fr[key],
      values,
    )
  }

/** Translator provided by a component that renders outside `<json-forms>` (`<FormBuilder>`). */
export const UiTranslatorKey: InjectionKey<Translator | undefined> = Symbol.for(
  'jsonforms-vue-nuxtui:UiTranslator',
)

/**
 * Interface texts inside a component: the translator of the enclosing `<json-forms>` (its
 * `i18n.translate`), or one provided through `UiTranslatorKey`. Call the result in render or
 * computed code so that a locale change re-renders.
 */
export const useUiText = (): UiText => {
  const jsonforms = inject<JsonFormsSubStates | undefined>('jsonforms', undefined)
  const provided = inject(UiTranslatorKey, undefined)
  return (key, values) => createUiText(provided ?? jsonforms?.i18n?.translate)(key, values)
}
