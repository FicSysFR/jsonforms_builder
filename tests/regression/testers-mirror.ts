/**
 * Mirror of the package testers — without importing Vue SFCs (`@nuxt/ui`).
 * Must stay aligned with `src/controls/*` and `src/layouts/*`.
 */
import {
  and,
  categorizationHasCategory,
  formatIs,
  isAllOfControl,
  isAnyOfControl,
  isBooleanControl,
  isCategorization,
  isDateControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isMultiLineControl,
  isNumberControl,
  isObjectArrayControl,
  isObjectControl,
  isOneOfControl,
  isPrimitiveArrayControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
  uiTypeIs,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core'
import { isCombinatorItemsArray } from '../../src/composables/useArrayControl'
import { isRenderableObjectSchema } from '../../src/composables/useObjectControl'
import { isSliderControl } from '../../src/composables/useSliderControl'

export type MirroredTester = {
  name: string
  tester: (
    uischema: UISchemaElement,
    schema: JsonSchema,
    context: { rootSchema: JsonSchema; config?: unknown },
  ) => number
}

export const mirroredTesters: MirroredTester[] = [
  { name: 'InputControl', tester: rankWith(1, isStringControl) },
  { name: 'BooleanControl', tester: rankWith(1, isBooleanControl) },
  { name: 'NumericControl', tester: rankWith(1, or(isIntegerControl, isNumberControl)) },
  { name: 'PasswordControl', tester: rankWith(2, and(isStringControl, formatIs('password'))) },
  { name: 'TextareaControl', tester: rankWith(2, and(isStringControl, isMultiLineControl)) },
  { name: 'DateControl', tester: rankWith(2, isDateControl) },
  { name: 'EnumControl', tester: rankWith(2, isEnumControl) },
  {
    name: 'RadioGroupControl',
    tester: rankWith(20, and(isEnumControl, optionIs('format', 'radio'))),
  },
  { name: 'SliderControl', tester: rankWith(4, isSliderControl) },
  {
    name: 'ObjectControl',
    tester: rankWith(2, and(isObjectControl, schemaMatches(isRenderableObjectSchema))),
  },
  { name: 'OneOfControl', tester: rankWith(3, or(isOneOfControl, isAnyOfControl)) },
  { name: 'AllOfControl', tester: rankWith(4, isAllOfControl) },
  {
    name: 'ArrayControl',
    tester: (uischema, schema, context) => {
      if (isObjectArrayControl(uischema, schema, context)) return 2
      if (isCombinatorItemsArray(uischema, schema, context)) return 2
      return isPrimitiveArrayControl(uischema, schema, context) ? 1 : -1
    },
  },
  { name: 'VerticalHorizontalLayout', tester: rankWith(1, isLayout) },
  { name: 'GroupLayout', tester: rankWith(2, uiTypeIs('Group')) },
  {
    name: 'CategorizationLayout',
    tester: rankWith(2, and(isCategorization, categorizationHasCategory)),
  },
  { name: 'ListWithDetail', tester: rankWith(4, uiTypeIs('ListWithDetail')) },
]

export const resolveWinner = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  rootSchema: JsonSchema,
): { name: string; rank: number } | null => {
  const context = { rootSchema, config: undefined }
  let best: { name: string; rank: number } | null = null

  for (const entry of mirroredTesters) {
    let rank = -1
    try {
      rank = entry.tester(uischema, schema, context)
    } catch {
      continue
    }

    if (rank < 0) continue
    if (!best || rank > best.rank) {
      best = { name: entry.name, rank }
    }
  }

  return best
}
