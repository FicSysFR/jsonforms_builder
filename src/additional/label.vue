<template lang="pug">
  .space-y-2(v-if="label.visible" :id="label.id")
    component(
      :is="headingTag"
      :class="styles.label.root"
      :style="labelStyle"
      v-text="label.text"
    )
    u-separator(v-if="appliedOptions.separator !== false")
</template>

<script lang="ts">
import {
  type JsonFormsRendererRegistryEntry,
  type LabelElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsLabel, type RendererProps } from '@jsonforms/vue'
import USeparator from '@nuxt/ui/components/Separator.vue'
import { useUiLabel } from '../utils'

/**
 * LabelRenderer
 *
 * Rend les éléments `type: "Label"` du uischema : un titre de section, suivi d'un
 * filet de séparation.
 *
 * La v1 détournait un `q-toolbar` pour cet usage — beaucoup de structure pour du texte.
 * Ici c'est un simple titre, dont le niveau est réglable via `options.level` (h1…h6)
 * afin de rester correct pour les lecteurs d'écran quand plusieurs sections s'imbriquent.
 */
const labelRenderer = defineComponent({
  name: 'LabelRenderer',
  components: {
    USeparator,
  },
  props: {
    ...rendererProps<LabelElement>(),
  },
  setup(props: RendererProps<LabelElement>) {
    const label = useUiLabel(useJsonFormsLabel(props))

    const headingTag = computed(() => {
      const level = Number(label.appliedOptions.value?.level)

      return level >= 1 && level <= 6 ? `h${level}` : 'h3'
    })

    const labelStyle = computed(() => label.appliedOptions.value?.style ?? {})

    return { ...label, headingTag, labelStyle }
  },
})

export default labelRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: labelRenderer,
  tester: rankWith(1, uiTypeIs('Label')),
}
</script>
