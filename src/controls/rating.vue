<template lang="pug">
  control-wrapper(
    v-bind="controlWrapper"
    :styles="styles"
    :ui-props="uiProps"
    :show-description="showDescription()"
    :hide-required-asterisk="!!appliedOptions.hideRequiredAsterisk"
  )
    .flex.items-center.gap-3
      u-input-rating(
        v-bind="uiProps('inputRating')"
        :id="control.id + '-input'"
        :model-value="modelValue"
        :length="length"
        :step="step"
        :disabled="isDisabled"
        :readonly="isReadonly"
        :clearable="clearable"
        :icon="appliedOptions.icon"
        :empty-icon="appliedOptions.emptyIcon"
        :color="control.errors ? 'error' : undefined"
        hoverable
        @update:model-value="onChange"
      )
      span.shrink-0.text-sm.tabular-nums.text-muted(
        v-if="appliedOptions.hideValue !== true"
        v-text="valueLabel"
      )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  and,
  or,
  isIntegerControl,
  isNumberControl,
  optionIs,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl, type RendererProps } from '@jsonforms/vue'
import UInputRating from '@nuxt/ui/components/InputRating.vue'
import { ControlWrapper } from '../common'
import { determineClearValue } from '../utils'
import { useRatingControl } from '../composables'

/**
 * RatingControlRenderer
 *
 * Rend les nombres marqués `options.format: "rating"` avec un `UInputRating`.
 *
 * Le `maximum` du schéma fixe le nombre d'icônes et `multipleOf` leur subdivision :
 * `{ "maximum": 5, "multipleOf": 0.5 }` donne cinq étoiles au demi-pas, sans option
 * supplémentaire. La note chiffrée reste affichée à côté — une rangée d'étoiles seule
 * s'estime mal au-delà de trois ou quatre icônes (`options.hideValue: true` la retire).
 */
const controlRenderer = defineComponent({
  name: 'RatingControlRenderer',
  components: {
    ControlWrapper,
    UInputRating,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const jsonFormsControl = useJsonFormsControl(props)
    const clearValue = determineClearValue(undefined)

    const control = useRatingControl({
      jsonFormsControl,
      clearValue,
    })

    const valueLabel = computed(() => {
      const data = control.control.value.data

      return typeof data === 'number' ? `${data} / ${control.length.value}` : '—'
    })

    return { ...control, valueLabel }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  // prettier-ignore
  tester: rankWith(20, and(or(isIntegerControl, isNumberControl), optionIs('format', 'rating'))), // Matches numeric controls with option format set to 'rating'
}
</script>
