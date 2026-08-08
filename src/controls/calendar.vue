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
        v-bind="uiProps('calendar')"
        :id="control.id + '-input'"
        :model-value="calendarValue"
        :locale="appliedOptions.locale ?? 'fr-FR'"
        :disabled="isDisabled || isReadonly"
        :color="control.errors ? 'error' : undefined"
        :number-of-months="appliedOptions.months"
        :week-numbers="!!appliedOptions.weekNumbers"
        @update:model-value="onChangeDateValue"
      )
      .flex.items-center.justify-end(v-if="calendarValue && !isDisabled && !isReadonly")
        u-button(
          color="neutral"
          variant="link"
          size="xs"
          icon="i-lucide-x"
          label="Effacer"
          @click="onChangeDateValue(null)"
        )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  isDateControl,
  optionIs,
} from '@jsonforms/core'
import { computed, defineComponent, type Component } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useDateControl } from '../composables'

/**
 * CalendarControlRenderer
 *
 * Rend les dates marquées `options.format: "calendar"` avec un `UCalendar` déplié.
 *
 * Complément de `DateControlRenderer` (champ segmenté) : le calendrier permanent sert les
 * formulaires où la date *est* le sujet — réservation, planning — et où l'utilisateur
 * raisonne en jours de la semaine plutôt qu'en chiffres.
 *
 * La conversion chaîne ⇄ `@internationalized/date` est celle de `useDateControl` : les deux
 * renderers écrivent donc exactement la même valeur pour le même schéma.
 *
 * `UCalendar` n'a pas de « vider » natif — un jour cliqué ne se déclique pas : le bouton
 * ci-dessus est le seul moyen de repasser un champ facultatif à vide.
 */
// Annotation explicite : `UCalendar` expose des types internes de `reka-ui` que le
// générateur de déclarations ne sait pas nommer depuis `dist/` (TS2742), comme `UInputDate`.
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

    /**
     * `null` et non `undefined` pour l'absence de valeur : `undefined` fait basculer
     * `UCalendar` en mode non contrôlé, et la sélection cesserait de suivre le modèle.
     */
    const calendarValue = computed(() => control.dateValue.value ?? null)

    return { ...control, calendarValue }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(20, and(isDateControl, optionIs('format', 'calendar'))), // Matches date controls with option format set to 'calendar'
}
</script>
