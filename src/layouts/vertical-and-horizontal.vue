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
 * Classes de colonnes, en dur et non construites dynamiquement.
 *
 * Tailwind analyse les sources statiquement : une classe assemblée à l'exécution
 * (`md:grid-cols-${n}`, comme le faisait la v1 avec `col-md-${12 / n}`) n'est jamais
 * générée dans la feuille finale. D'où cette table de correspondance explicite.
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
 * Rend les `VerticalLayout` et `HorizontalLayout` avec une grille CSS Tailwind.
 *
 * En vertical, une colonne. En horizontal, autant de colonnes que d'éléments
 * (plafonné à 6), qui retombent sur une seule colonne en mobile.
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
