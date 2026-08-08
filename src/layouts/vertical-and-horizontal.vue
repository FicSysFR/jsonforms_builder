<template lang="pug">
  div(
    v-if="layout.visible"
    :class="[layoutClassObject.root, columnsClass]"
  )
    .min-w-0(
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="layoutClassObject.item"
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
  isLayout,
  type JsonFormsRendererRegistryEntry,
  type Layout,
  rankWith,
} from '@jsonforms/core'
import { computed, defineComponent } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
  type RendererProps,
} from '@jsonforms/vue'
import { useUiLayout } from '../utils'

/**
 * Column classes, hard-coded rather than built dynamically.
 *
 * Tailwind scans sources statically: a class assembled at runtime
 * (`md:grid-cols-${n}`, as v1 did with `col-md-${12 / n}`) is never generated in the
 * final stylesheet. Hence this explicit lookup table.
 */
const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
}

/**
 * LayoutRenderer
 *
 * Renders `VerticalLayout` and `HorizontalLayout` with a Tailwind CSS grid.
 *
 * Vertical: one column. Horizontal: as many columns as there are elements
 * (capped at 6), collapsing to a single column on mobile.
 */
const layoutRenderer = defineComponent({
  name: 'LayoutRenderer',
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    const renderedProps = useUiLayout(useJsonFormsLayout(props))

    const layoutClassObject = computed(() =>
      renderedProps.layout.value.direction === 'row'
        ? renderedProps.styles.horizontalLayout
        : renderedProps.styles.verticalLayout,
    )

    const columnsClass = computed(() => {
      if (renderedProps.layout.value.direction !== 'row') {
        return ''
      }

      const count = renderedProps.layout.value.uischema.elements?.length ?? 1

      return COLUMN_CLASSES[Math.min(Math.max(count, 1), 6)]
    })

    return { ...renderedProps, layoutClassObject, columnsClass }
  },
})

export default layoutRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(1, isLayout), // Matches UI elements with layout types (VerticalLayout/HorizontalLayout)
}
</script>
