<template lang="pug">
  .categorization(:class="styles.categorization.root")
    //- Variante « assistant » : une étape à la fois, avec navigation précédent / suivant.
    template(v-if="isStepper")
      u-stepper(
        v-bind="uiProps('stepper')"
        :model-value="activeIndex"
        :items="stepperItems"
        :class="styles.categorization.stepper"
        @update:model-value="onStepperChange"
      )
        template(#content="{ item }")
          .pt-4(:class="styles.categorization.panel")
            dispatch-renderer(
              :schema="layout.schema"
              :uischema="item.uischema"
              :path="layout.path"
              :enabled="layout.enabled"
              :renderers="layout.renderers"
              :cells="layout.cells"
            )

      .flex.items-center.justify-between.gap-2(:class="styles.categorization.stepperFooter")
        u-button(
          :disabled="activeIndex === 0"
          :class="styles.categorization.stepperButtonBack"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          label="Précédent"
          @click="goToStep(activeIndex - 1)"
        )
        u-button(
          :disabled="activeIndex >= visibleCategories.length - 1"
          :class="styles.categorization.stepperButtonNext"
          trailing-icon="i-lucide-arrow-right"
          label="Suivant"
          @click="goToStep(activeIndex + 1)"
        )

    //- Variante par défaut : onglets.
    u-tabs(
      v-else
      v-bind="uiProps('tabs')"
      :model-value="activeCategory"
      :items="tabItems"
      :class="styles.categorization.tabs"
      value-key="value"
      @update:model-value="activeCategory = String($event)"
    )
      template(#content="{ item }")
        .pt-4(:class="styles.categorization.panel")
          dispatch-renderer(
            :schema="layout.schema"
            :uischema="item.uischema"
            :path="layout.path"
            :enabled="layout.enabled"
            :renderers="layout.renderers"
            :cells="layout.cells"
          )
</template>

<script lang="ts">
import {
  and,
  categorizationHasCategory,
  isCategorization,
  JsonFormsRendererRegistryEntry,
  rankWith,
  type Layout,
} from '@jsonforms/core'
import { DispatchRenderer, rendererProps, useJsonFormsCategorization, type RendererProps } from '@jsonforms/vue'
import { computed, defineComponent, onMounted } from 'vue'
import UTabs from '@nuxt/ui/components/Tabs.vue'
import UStepper from '@nuxt/ui/components/Stepper.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { useUiLayout } from '../utils'
import { useHashState } from '../composables'
import { get, isString } from 'radash'

const DEFAULT_QUERY_KEY = 'tab'
const DEFAULT_DEFAULT_TAB = '0'

/**
 * CategorizationRenderer
 *
 * Rend les `Categorization` en onglets (`UTabs`) ou, avec `options.variant: "stepper"`,
 * en assistant pas-à-pas (`UStepper`) — cette seconde variante était déclarée dans le
 * thème de la v1 mais n'avait jamais été implémentée.
 *
 * La catégorie active est persistée dans le hash de l'URL (`#tab=…`), ce qui rend les
 * formulaires longs partageables et résistants au rechargement.
 */
const layoutRenderer = defineComponent({
  name: 'categorization-renderer',
  components: {
    DispatchRenderer,
    UTabs,
    UStepper,
    UButton,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    const { state, set } = useHashState()
    const renderedProps = useUiLayout(useJsonFormsCategorization(props))
    const queryKey = get(renderedProps.layout.value, 'uischema.options.queryKey', DEFAULT_QUERY_KEY)
    const defaultTab = get(renderedProps.layout.value, 'uischema.options.defaultTab', DEFAULT_DEFAULT_TAB)

    const isStepper = computed(
      () => renderedProps.appliedOptions.value?.variant === 'stepper',
    )

    const activeCategory = computed({
      get: () => state.value[queryKey] || defaultTab,
      set: (val: string) => {
        set({ [queryKey]: val })
      },
    })

    const extendedCategories = computed(() =>
      renderedProps.categories.map((category, index) => {
        const value = category.value
        const queryId = get(value, 'uischema.options.queryId', `${index}`)

        return {
          value,
          queryId,
        }
      }),
    )

    const visibleCategories = computed(() =>
      extendedCategories.value.filter((category) => {
        const visibility = category.value?.visible

        return visibility === undefined ? true : visibility
      }),
    )

    /** Forme attendue par `UTabs` / `UStepper`, en conservant l'uischema de chaque onglet. */
    const tabItems = computed(() =>
      visibleCategories.value.map((category) => ({
        value: category.queryId,
        label: category.value?.label ?? '',
        uischema: category.value?.uischema,
      })),
    )

    const stepperItems = computed(() =>
      tabItems.value.map((item) => ({
        title: item.label,
        value: item.value,
        uischema: item.uischema,
      })),
    )

    /** `UStepper` raisonne en index numérique là où le hash porte un identifiant. */
    const activeIndex = computed(() =>
      Math.max(
        tabItems.value.findIndex((item) => item.value === activeCategory.value),
        0,
      ),
    )

    const goToStep = (index: number) => {
      const target = tabItems.value[index]
      if (target) {
        activeCategory.value = target.value
      }
    }

    const onStepperChange = (value: string | number) => {
      if (typeof value === 'number') {
        goToStep(value)
        return
      }

      activeCategory.value = value
    }

    onMounted(() => {
      const selectedCategory = state.value[queryKey]

      if (!isString(selectedCategory)) {
        set({ [queryKey]: defaultTab })
        return
      }

      const match = extendedCategories.value.find((category) => {
        return selectedCategory === category.queryId && category.value.visible
      })

      if (!match) {
        set({ [queryKey]: defaultTab })
      }
    })

    return {
      ...renderedProps,

      isStepper,
      activeCategory,
      activeIndex,
      extendedCategories,
      visibleCategories,
      tabItems,
      stepperItems,
      goToStep,
      onStepperChange,
    }
  },
})

export default layoutRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(2, and(isCategorization, categorizationHasCategory)),
}
</script>
