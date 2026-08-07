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
      icon="i-lucide-clock"
      @update:model-value="onChangeDateValue"
      @focus="handleFocus"
      @blur="handleBlur"
    )
    u-input-date(
      v-else
      v-bind="uiProps('inputDate')"
      :id="control.id + '-input'"
      :model-value="dateValue"
      :class="styles.control.input"
      :disabled="isDisabled"
      :readonly="isReadonly"
      :autofocus="appliedOptions.focus"
      :granularity="granularity"
      :locale="appliedOptions.locale ?? 'fr-FR'"
      hour-cycle="24"
      :icon="inputType === 'datetime-local' ? 'i-lucide-calendar-clock' : 'i-lucide-calendar'"
      @update:model-value="onChangeDateValue"
      @focus="handleFocus"
      @blur="handleBlur"
    )
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, rankWith, or, isDateControl, isDateTimeControl, isTimeControl } from '@jsonforms/core'
import { defineComponent, type DefineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, RendererProps } from '@jsonforms/vue'
import UInputDate from '@nuxt/ui/components/InputDate.vue'
import UInputTime from '@nuxt/ui/components/InputTime.vue'
import { ControlWrapper } from '../common'
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
 * Ils travaillent sur des objets `@internationalized/date` et non des chaînes : la
 * conversion aller-retour vers le motif du schéma est faite par `useDateControl`
 * (`dateValue` / `onChangeDateValue`).
 */
// Annotation explicite : `UInputDate` / `UInputTime` exposent dans leurs props des types
// internes de `reka-ui` que le générateur de déclarations ne sait pas nommer depuis
// `dist/` (TS2742). Les consommateurs ne câblent jamais ces props à la main — le renderer
// est instancié par JSONForms —, la perte d'inférence est donc sans conséquence.
const controlRenderer: DefineComponent<any, any, any> = defineComponent({
  name: 'DateControlRenderer',
  components: {
    ControlWrapper,
    UInputDate,
    UInputTime,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    return useDateControl({
      jsonFormsControl,
      clearValue,
      debounceWait: 100,
    })
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(2,
    or(
      isDateControl,
      isDateTimeControl,
      isTimeControl,
    ),
  ), // Matches schema properties with format "date", "date-time" or "time"
}
</script>
