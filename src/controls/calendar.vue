<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .space-y-2
      u-calendar(
        v-bind="calendarBind"
        :id="control.id + '-input'"
        :type="calendarType"
        :range="isRange"
        :model-value="calendarValue"
        :locale="appliedOptions.locale ?? 'fr-FR'"
        :disabled="isDisabled || isReadonly"
        :color="control.errors ? 'error' : undefined"
        :number-of-months="appliedOptions.months ?? (isRange ? 2 : undefined)"
        :week-numbers="!!appliedOptions.weekNumbers"
        :min-value="dateConstraints.minValue"
        :max-value="dateConstraints.maxValue"
        :is-date-unavailable="dateConstraints.isDateUnavailable"
        :is-month-unavailable="dateConstraints.isMonthUnavailable"
        :is-year-unavailable="dateConstraints.isYearUnavailable"
        @update:model-value="onCalendarChange"
      )
      .flex.items-center.justify-end(v-if="hasValue && !isDisabled && !isReadonly")
        u-button(
          color="neutral"
          variant="link"
          size="xs"
          icon="i-lucide-x"
          label="Effacer"
          @click="onCalendarChange(null)"
        )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  or,
  isDateControl,
  optionIs,
  uiTypeIs,
  schemaMatches,
} from '@jsonforms/core'
import { computed, defineComponent, type Component } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import {
  CALENDAR_CONSTRAINT_CELL_UI,
  fromDateRangeValue,
  toDateRangeValue,
  useDateControl,
} from '../composables'

/**
 * CalendarControlRenderer
 *
 * Renders dates marked with `options.format: "calendar"` using an expanded `UCalendar`.
 *
 * `options.range: true` on an `{ start, end }` object enables range selection.
 * Exclusions (`disabledDates`, weekdays, months, years) go through `is*Unavailable`
 * (struck through + muted) to stay readable under range highlighting.
 */
const controlRenderer: Component = defineComponent({
  name: 'CalendarControlRenderer',
  components: {
    ControlWrapper,
    UButton,
    UCalendar,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useDateControl({
      jsonFormsControl,
      clearValue,
    })

    const isRange = computed(() => !!control.appliedOptions.value?.range)

    const calendarBind = computed(() => {
      const fromOptions = control.uiProps('calendar') as Record<string, unknown>
      const optionUi = (fromOptions.ui ?? {}) as Record<string, unknown>
      const optionTrigger = optionUi.cellTrigger

      return {
        ...fromOptions,
        ui: {
          ...optionUi,
          cellTrigger: [optionTrigger, CALENDAR_CONSTRAINT_CELL_UI].filter(Boolean).join(' '),
        },
      }
    })

    const calendarValue = computed(() => {
      if (isRange.value) {
        const range = toDateRangeValue(
          control.control.value.data,
          String(control.optionPattern.value ?? ''),
        )
        return {
          start: range.start,
          end: range.end,
        }
      }

      return control.dateValue.value ?? null
    })

    const hasValue = computed(() => {
      if (isRange.value) {
        const data = control.control.value.data as { start?: string } | undefined
        return !!data?.start
      }

      return !!calendarValue.value
    })

    const onCalendarChange = (value: unknown) => {
      if (isRange.value) {
        const next = fromDateRangeValue(
          value as {
            start?: { year: number; month: number; day: number }
            end?: { year: number; month: number; day: number }
          } | null,
          String(control.optionPattern.value ?? ''),
        )
        control.onChange(control.adaptTarget(next))
        return
      }

      control.onChangeDateValue(value as Parameters<typeof control.onChangeDateValue>[0])
    }

    return {
      ...control,
      isRange,
      calendarBind,
      calendarValue,
      hasValue,
      onCalendarChange,
    }
  },
})

export default controlRenderer

const isCalendarRangeObject = and(
  uiTypeIs('Control'),
  optionIs('format', 'calendar'),
  optionIs('range', true),
  schemaMatches((schema) => schema.type === 'object'),
)

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(
    25,
    or(
      and(isDateControl, optionIs('format', 'calendar')),
      isCalendarRangeObject,
    ),
  ),
}
</script>
