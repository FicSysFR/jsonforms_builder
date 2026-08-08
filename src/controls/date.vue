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
                  v-bind="uiProps('calendar')"
                  :type="calendarType"
                  :model-value="calendarValue"
                  :locale="appliedOptions.locale ?? 'fr-FR'"
                  :color="control.errors ? 'error' : undefined"
                  :number-of-months="appliedOptions.months"
                  :week-numbers="!!appliedOptions.weekNumbers"
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
import { useDateControl } from '../composables'

/**
 * DateControlRenderer
 *
 * Rend les formats `date`, `date-time` et `time` avec `UInputDate` / `UInputTime`.
 *
 * Ces composants sont *segmentés* : chaque partie (jour, mois, année, heure…) est une
 * zone d'édition à part entière, avec incrément aux flèches et navigation clavier
 * fournis nativement — là où la v1 réimplémentait masque, curseur et flèches à la main
 * par-dessus un `q-input`, doublé d'un `q-popup-proxy` contenant `q-date` / `q-time`.
 *
 * L'icône ouvre un popover dans une `UCard` : calendrier (`date`), spinners d'heure
 * (`time`), ou les deux côte à côte (`date-time`) — comme `q-date` + `q-time` en v1.
 * Le popover s'ancre sur le bouton icône (`align: end`) pour rester sous le champ.
 *
 * Ils travaillent sur des objets `@internationalized/date` et non des chaînes : la
 * conversion aller-retour vers le motif du schéma est faite par `useDateControl`
 * (`dateValue` / `onChangeDateValue`).
 */
// Annotation explicite : `UInputDate` / `UInputTime` exposent dans leurs props des types
// internes de `reka-ui` que le générateur de déclarations ne sait pas nommer depuis
// `dist/` (TS2742). Les consommateurs ne câblent jamais ces props à la main — le renderer
// est instancié par JSONForms —, la perte d'inférence est donc sans conséquence.
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
     * `UInputDate` / reka-ui n'exposent pas de granularité `month` / `year` : le segment
     * jour (et mois) reste dans le DOM. On le masque quand le motif du schéma ne le
     * demande pas (`YYYY.MM`, `YYYY`), y compris le séparateur adjacent selon la locale.
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
     * `null` et non `undefined` pour l'absence de valeur : `undefined` fait basculer
     * `UCalendar` en mode non contrôlé. Pour `date-time`, on ne passe que la partie jour.
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

      // Mois / année seuls : on fixe le jour (et le mois pour l'année) à 1 pour
      // que le motif `YYYY.MM` / `YYYY` ne dépende pas d'un jour choisi ailleurs.
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
