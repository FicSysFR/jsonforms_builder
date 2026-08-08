import type { UISchemaElement } from '@jsonforms/core'
import { inject } from 'vue'
import { defu } from 'defu'
import { defaultTheme } from './defaultTheme'

/**
 * Renderer theme.
 *
 * Each entry is a **Tailwind class string** applied to the `class` of the matching Nuxt UI
 * component. This is deliberately `class`, not `ui`: fine overrides of Nuxt UI internal
 * slots go through uischema options (`options.formField.ui`, `options.input.ui`, …), read
 * by `uiProps()`.
 *
 * Three levels stack, weakest to strongest:
 *  1. `defaultTheme` — bare minimum, so we do not compete with the host design system;
 *  2. the theme injected by the app (`provide('styles', …)`);
 *  3. `uischema.options.styles` — local override for one element.
 */
export interface Theme {
  control: {
    /** Classes on the `UFormField` wrapping the control. */
    root?: string
    /** Classes on the input component itself (`UInput`, `USelect`, …). */
    input?: string
  }
  verticalLayout: {
    root?: string
    item?: string
  }
  horizontalLayout: {
    root?: string
    item?: string
  }
  group: {
    root?: string
    label?: string
    item?: string
  }
  arrayList: {
    root?: string
    legend?: string
    addButton?: string
    label?: string
    itemWrapper?: string
    noData?: string
    item?: string
    itemToolbar?: string
    itemLabel?: string
    itemContent?: string
    itemExpanded?: string
    itemMoveUp?: string
    itemMoveDown?: string
    itemDelete?: string
  }
  label: {
    root?: string
  }
  oneOf: {
    root?: string
    select?: string
  }
  categorization: {
    root?: string
    tabs?: string
    panel?: string
    stepper?: string
    stepperFooter?: string
    stepperButtonBack?: string
    stepperButtonNext?: string
  }
}

/**
 * Resolves the theme applicable to a uischema element.
 *
 * @param element - Uischema element whose `options.styles` override the injected theme.
 */
export const useTheme = (element?: UISchemaElement): Theme => {
  const injected = inject<Partial<Theme>>('styles', defaultTheme)
  const local = element?.options?.styles as Partial<Theme> | undefined

  if (!local) {
    return defu(injected, defaultTheme) as Theme
  }

  return defu(local, injected, defaultTheme) as Theme
}

/** @deprecated Kept for migration from v1 — use `useTheme`. */
export const useStyles = useTheme

/** @deprecated Kept for migration from v1 — use `Theme`. */
export type Styles = Theme
