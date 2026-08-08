<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    u-input-time(
      v-if="inputType === 'time'"
      v-bind="uiProps('inputTime')"
      :id="control.id + '-input'"
      :model-value="dateValue"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :autofocus="appliedOptions.focus"
      :granularity="optionPattern.includes('s') ? 'second' : 'minute'"
      :locale="appliedOptions.locale ?? 'fr-FR'"
      hour-cycle="24"
      @update:model-value="onChangeDateValue"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#trailing)
        u-popover(
          v-if="!isDisabled && !isReadonly"
          v-model:open="pickerOpen"
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
        )
          u-button(
            icon="i-lucide-clock"
            color="neutral"
            variant="link"
            size="sm"
            class="px-0"
            aria-label="Ouvrir le sélecteur d'heure"
            tabindex="-1"
          )
          template(#content)
            u-card(v-bind="uiProps('timeCard')" :ui="{ body: 'p-3' }")
              time-picker(
                :hour="timeParts.hour"
                :minute="timeParts.minute"
                :second="timeParts.second"
                :show-seconds="showSeconds"
                :ui-props="uiProps"
                @update:hour="onHourChange"
                @update:minute="onMinuteChange"
                @update:second="onSecondChange"
              )
        u-icon(v-else name="i-lucide-clock" class="text-dimmed size-5")
    u-input-date(
      v-else
      v-bind="uiProps('inputDate')"
      :id="control.id + '-input'"
      :model-value="dateValue"
      :class="[styles.control.input, dateInputClass]"
      :data-date-precision="calendarType"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :autofocus="appliedOptions.focus"
      :granularity="granularity"
      :locale="appliedOptions.locale ?? 'fr-FR'"
      :min-value="dateConstraints.minValue"
      :max-value="dateConstraints.maxValue"
      :is-date-unavailable="dateConstraints.isDateUnavailable"
      hour-cycle="24"
      @update:model-value="onChangeDateValue"
      @focus="handleFocus"
      @blur="handleBlur"
    )
      template(#trailing)
        u-popover(
          v-if="!isDisabled && !isReadonly"
          v-model:open="pickerOpen"
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
        )
          u-button(
            :icon="calendarIcon"
            color="neutral"
            variant="link"
            size="sm"
            class="px-0"
            :aria-label="pickerAriaLabel"
            tabindex="-1"
          )
          template(#content)
            u-card(v-bind="uiProps('calendarCard')" :ui="{ body: 'p-2' }")
              .flex.flex-col.gap-3.items-stretch(class="sm:flex-row")
                u-calendar(
                  v-bind="calendarBind"
                  :type="calendarType"
                  :model-value="calendarValue"
                  :locale="appliedOptions.locale ?? 'fr-FR'"
                  :color="control.errors ? 'error' : undefined"
                  :number-of-months="appliedOptions.months"
                  :week-numbers="!!appliedOptions.weekNumbers"
                  :min-value="dateConstraints.minValue"
                  :max-value="dateConstraints.maxValue"
                  :is-date-unavailable="dateConstraints.isDateUnavailable"
                  :is-month-unavailable="dateConstraints.isMonthUnavailable"
                  :is-year-unavailable="dateConstraints.isYearUnavailable"
                  @update:model-value="onCalendarSelect"
                )
                .flex.flex-col.justify-center.border-t.border-default.pt-3(
                  v-if="inputType === 'datetime-local'"
                  class="sm:border-t-0 sm:border-s sm:pt-0 sm:ps-3"
                )
                  time-picker(
                    :hour="timeParts.hour"
                    :minute="timeParts.minute"
                    :second="timeParts.second"
                    :show-seconds="showSeconds"
                    :ui-props="uiProps"
                    @update:hour="onHourChange"
                    @update:minute="onMinuteChange"
                    @update:second="onSecondChange"
                  )
        u-icon(
          v-else
          :name="calendarIcon"
          class="text-dimmed size-5"
        )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  or,
  isDateControl,
  isDateTimeControl,
  isTimeControl,
} from '@jsonforms/core'
import {
  CalendarDate,
  CalendarDateTime,
  Time,
  getLocalTimeZone,
  today,
  type DateValue,
} from '@internationalized/date'
import { computed, defineComponent, ref, type Component } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInputDate from '@nuxt/ui/components/InputDate.vue'
import UInputTime from '@nuxt/ui/components/InputTime.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { ControlWrapper, TimePicker } from '../common'
import { determineClearValue } from '../utils'
import { CALENDAR_CONSTRAINT_CELL_UI, useDateControl } from '../composables'

/**
 * DateControlRenderer
 *
 * Renders `date`, `date-time`, and `time` formats with `UInputDate` / `UInputTime`.
 *
 * These components are *segmented*: each part (day, month, year, time…) is its own
 * editable zone, with arrow increment and native keyboard navigation — whereas v1
 * reimplemented mask, cursor, and arrows by hand on top of a `q-input`, paired with
 * a `q-popup-proxy` containing `q-date` / `q-time`.
 *
 * The icon opens a popover in a `UCard`: calendar (`date`), time spinners (`time`),
 * or both side by side (`date-time`) — like `q-date` + `q-time` in v1.
 * The popover anchors to the icon button (`align: end`) to stay below the field.
 *
 * They work with `@internationalized/date` objects rather than strings: round-trip
 * conversion to the schema pattern is handled by `useDateControl`
 * (`dateValue` / `onChangeDateValue`).
 */
// Explicit annotation: `UInputDate` / `UInputTime` expose internal `reka-ui` prop types
// that the declaration generator cannot name from `dist/` (TS2742). Consumers never
// wire these props manually — the renderer is instantiated by JSONForms — so the loss
// of inference is inconsequential.
const controlRenderer: Component = defineComponent({
  name: 'DateControlRenderer',
  components: {
    ControlWrapper,
    TimePicker,
    UButton,
    UCalendar,
    UCard,
    UIcon,
    UInputDate,
    UInputTime,
    UPopover,
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
      debounceWait: 100,
    })

    const pickerOpen = ref(false)

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

    const calendarIcon = computed(() =>
      control.inputType.value === 'datetime-local'
        ? 'i-lucide-calendar-clock'
        : 'i-lucide-calendar',
    )

    const pickerAriaLabel = computed(() =>
      control.inputType.value === 'datetime-local'
        ? "Ouvrir le calendrier et l'heure"
        : 'Ouvrir le calendrier',
    )

    const showSeconds = computed(() => {
      const pattern = control.optionPattern.value
      return typeof pattern === 'string' && pattern.includes('s')
    })

    /**
     * `UInputDate` / reka-ui do not expose `month` / `year` granularity: the day
     * segment (and month) stays in the DOM. Hide it when the schema pattern does not
     * require it (`YYYY.MM`, `YYYY`), including the adjacent separator per locale.
     */
    const dateInputClass = computed(() => {
      if (control.calendarType.value === 'month') {
        return [
          '[&_[data-segment=day]]:hidden',
          '[&_[data-segment=day]+[data-segment=literal]]:hidden',
          '[&_[data-segment=literal]:has(+[data-segment=day])]:hidden',
        ].join(' ')
      }

      if (control.calendarType.value === 'year') {
        return [
          '[&_[data-segment=day]]:hidden',
          '[&_[data-segment=month]]:hidden',
          '[&_[data-segment=literal]]:hidden',
        ].join(' ')
      }

      return undefined
    })

    /**
     * `null` not `undefined` for missing value: `undefined` switches `UCalendar`
     * to uncontrolled mode. For `date-time`, only the day part is passed.
     */
    const calendarValue = computed(() => {
      const value = control.dateValue.value
      if (!value || !('year' in value)) {
        return null
      }

      return new CalendarDate(value.year, value.month, value.day)
    })

    const timeParts = computed(() => {
      const value = control.dateValue.value
      if (value && 'hour' in value) {
        return {
          hour: value.hour,
          minute: value.minute,
          second: 'second' in value ? (value.second ?? 0) : 0,
        }
      }

      return { hour: 0, minute: 0, second: 0 }
    })

    const applyTime = (hour: number, minute: number, second: number) => {
      if (control.inputType.value === 'time') {
        control.onChangeDateValue(new Time(hour, minute, second))
        return
      }

      const current = control.dateValue.value
      if (current && 'year' in current) {
        control.onChangeDateValue(
          new CalendarDateTime(current.year, current.month, current.day, hour, minute, second),
        )
        return
      }

      const now = today(getLocalTimeZone())
      control.onChangeDateValue(
        new CalendarDateTime(now.year, now.month, now.day, hour, minute, second),
      )
    }

    const onHourChange = (hour: number) => {
      applyTime(hour, timeParts.value.minute, timeParts.value.second)
    }

    const onMinuteChange = (minute: number) => {
      applyTime(timeParts.value.hour, minute, timeParts.value.second)
    }

    const onSecondChange = (second: number) => {
      applyTime(timeParts.value.hour, timeParts.value.minute, second)
    }

    const onCalendarSelect = (value: DateValue | null | undefined) => {
      if (!value) {
        control.onChangeDateValue(null)
        if (control.inputType.value === 'date') {
          pickerOpen.value = false
        }
        return
      }

      // Month / year only: set day (and month for year) to 1 so the `YYYY.MM` / `YYYY`
      // pattern does not depend on a day chosen elsewhere.
      const type = control.calendarType.value
      const month = type === 'year' ? 1 : value.month
      const day = type === 'date' ? value.day : 1

      if (control.inputType.value === 'datetime-local') {
        const { hour, minute, second } = timeParts.value
        control.onChangeDateValue(
          new CalendarDateTime(value.year, month, day, hour, minute, second),
        )
        return
      }

      control.onChangeDateValue(new CalendarDate(value.year, month, day))
      pickerOpen.value = false
    }

    return {
      ...control,
      pickerOpen,
      calendarBind,
      calendarIcon,
      pickerAriaLabel,
      showSeconds,
      dateInputClass,
      calendarValue,
      timeParts,
      onHourChange,
      onMinuteChange,
      onSecondChange,
      onCalendarSelect,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(2, or(isDateControl, isDateTimeControl, isTimeControl)), // Matches schema properties with format "date", "date-time" or "time"
}
</script>
