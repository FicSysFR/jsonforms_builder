<template lang="pug">
  u-card(
    v-if="layout.visible"
    v-bind="uiProps('card')"
    :class="styles.group.root"
  )
    template(v-if="layout.label" #header)
      h4(:class="styles.group.label" v-text="layout.label")

    .grid.grid-cols-1.gap-4
      .min-w-0(
        v-for="(element, index) in layout.uischema.elements"
        :key="`${layout.path}-${index}`"
        :class="styles.group.item"
      )
        dispatch-renderer(
          :schema="layout.schema"
          :uischema="element"
          :path="layout.path"
          :enabled="layout.enabled"
          :renderers="layout.renderers"
          :cells="layout.cells"
        )
</template>

<script lang="ts">
import {
  type GroupLayout,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core'
import { defineComponent } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
  type RendererProps,
} from '@jsonforms/vue'
import UCard from '@nuxt/ui/components/Card.vue'
import { useUiLayout } from '../utils'

/**
 * GroupRenderer
 *
 * Rend les éléments `type: "Group"` du uischema dans une `UCard` titrée.
 *
 * Le thème déclarait déjà les slots `group.*` en v1, mais aucun renderer ne les
 * consommait : un `Group` retombait sur « No applicable renderer found ».
 */
const layoutRenderer = defineComponent({
  name: 'GroupRenderer',
  components: {
    DispatchRenderer,
    UCard,
  },
  props: {
    ...rendererProps<GroupLayout>(),
  },
  setup(props: RendererProps<GroupLayout>) {
    return useUiLayout(useJsonFormsLayout(props))
  },
})

export default layoutRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(2, uiTypeIs('Group')),
}
</script>
