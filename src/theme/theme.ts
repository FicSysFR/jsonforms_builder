import type { UISchemaElement } from '@jsonforms/core'
import { inject } from 'vue'
import { defu } from 'defu'
import { defaultTheme } from './defaultTheme'

/**
 * Thème des renderers.
 *
 * Chaque entrée est une **chaîne de classes Tailwind** appliquée sur le `class` du
 * composant Nuxt UI correspondant. C'est volontairement du `class` et non du `ui` :
 * les surcharges fines des slots internes de Nuxt UI passent par les options du
 * uischema (`options.formField.ui`, `options.input.ui`, …), lues par `uiProps()`.
 *
 * Trois niveaux se cumulent, du plus faible au plus fort :
 *  1. `defaultTheme` — le strict minimum, pour ne pas concurrencer le design system hôte ;
 *  2. le thème injecté par l'application (`provide('styles', …)`) ;
 *  3. `uischema.options.styles` — surcharge locale d'un élément.
 */
export interface Theme {
  control: {
    /** Classes portées par le `UFormField` qui enveloppe le contrôle. */
    root?: string
    /** Classes portées par le composant de saisie lui-même (`UInput`, `USelect`, …). */
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
 * Résout le thème applicable à un élément du uischema.
 *
 * @param element - Élément de uischema dont les `options.styles` surchargent le thème injecté.
 */
export const useTheme = (element?: UISchemaElement): Theme => {
  const injected = inject<Partial<Theme>>('styles', defaultTheme)
  const local = element?.options?.styles as Partial<Theme> | undefined

  if (!local) {
    return defu(injected, defaultTheme) as Theme
  }

  return defu(local, injected, defaultTheme) as Theme
}

/** @deprecated Conservé pour la migration depuis la v1 — utiliser `useTheme`. */
export const useStyles = useTheme

/** @deprecated Conservé pour la migration depuis la v1 — utiliser `Theme`. */
export type Styles = Theme
