<template lang="pug">
  .list-with-detail(v-if="control.visible" :id="controlWrapper.id" :class="styles.arrayList.root")
    .flex.items-center.justify-between.gap-2(:class="styles.arrayList.legend")
      h4(:class="styles.arrayList.label" v-text="computedLabel")
      u-button(
        :disabled="!canAdd"
        :class="styles.arrayList.addButton"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        size="sm"
        label="Ajouter"
        @click="addAndSelect"
      )

    p.text-sm(v-if="!items.length" :class="styles.arrayList.noData") Aucun élément.

    //- Master on the left, detail on the right from `md` upward; stacked below, since a
    //- narrow list beside a form is unusable on mobile.
    .grid.grid-cols-1.gap-3(v-else class="md:grid-cols-[14rem_1fr]")
      u-card(:ui="{ body: 'p-1' }")
        ul(role="listbox" class="space-y-0.5")
          li(v-for="(item, index) in items" :key="`${control.path}-${index}`" role="option" :aria-selected="index === selectedIndex")
            button.flex.w-full.items-center.gap-2.rounded.px-2.text-left.text-sm.transition-colors(
              type="button"
              :class="[index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-elevated', 'py-1.5']"
              @click="selectedIndex = index"
            )
              span.min-w-0.flex-1.truncate(v-text="itemLabel(index)")
              u-button(
                :disabled="!canRemove"
                icon="i-lucide-trash-2"
                aria-label="Supprimer l'élément"
                color="error"
                variant="ghost"
                size="xs"
                @click.stop="askRemove(index)"
              )

      u-card(:ui="{ body: 'p-3 sm:p-4' }")
        dispatch-renderer(
          v-if="selectedIndex !== null && selectedIndex < items.length"
          :key="childPath(selectedIndex)"
          :schema="control.schema"
          :uischema="childUiSchema"
          :path="childPath(selectedIndex)"
          :enabled="control.enabled"
          :renderers="control.renderers"
          :cells="control.cells"
        )
        p.text-sm.text-muted(v-else) Sélectionnez un élément pour l'éditer.

    p.text-xs.text-muted(v-if="control.description" v-text="control.description")
    p.text-sm.text-error(v-if="control.errors" v-text="control.errors")

    confirm-dialog(
      :open="pendingRemoveIndex !== null"
      :title="`Supprimer ${pendingRemoveLabel} ?`"
      description="Cette entrée sera retirée de la liste. L'action est irréversible."
      @update:open="cancelRemove"
      @confirm="confirmRemove"
    )
</template>

<script lang="ts">
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core'
import { computed, defineComponent, nextTick, ref, watch } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
  type RendererProps,
} from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import { ConfirmDialog } from '../common'
import { useArrayControl } from '../composables'

/**
 * ListWithDetailRenderer
 *
 * Renders `type: "ListWithDetail"` elements: the entry list on the left, the selected
 * entry's form on the right.
 *
 * Prefer this layout when each entry has many fields: the array renderer, which expands
 * everything, would become endless.
 *
 * `options.elementLabelProp` chooses the property shown in the list.
 */
const layoutRenderer = defineComponent({
  name: 'ListWithDetailRenderer',
  components: {
    ConfirmDialog,
    DispatchRenderer,
    UButton,
    UCard,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useArrayControl({
      jsonFormsControl: useJsonFormsArrayControl(props),
    })

    const selectedIndex = ref<number | null>(control.items.value.length ? 0 : null)

    // Selection must stay within bounds: removing the last entry would otherwise leave
    // an index pointing past the array, and the detail pane would empty for no reason.
    watch(control.items, (items) => {
      if (!items.length) {
        selectedIndex.value = null
        return
      }

      if (selectedIndex.value === null || selectedIndex.value >= items.length) {
        selectedIndex.value = items.length - 1
      }
    })

    const addAndSelect = () => {
      control.addItem()
      selectedIndex.value = control.items.value.length - 1
    }

    const pendingRemoveIndex = ref<number | null>(null)

    const pendingRemoveLabel = computed(() =>
      pendingRemoveIndex.value === null ? '' : `« ${control.itemLabel(pendingRemoveIndex.value)} »`,
    )

    const askRemove = (index: number) => {
      pendingRemoveIndex.value = index
    }

    const cancelRemove = () => {
      pendingRemoveIndex.value = null
    }

    const confirmRemove = async () => {
      const index = pendingRemoveIndex.value
      pendingRemoveIndex.value = null

      if (index === null) {
        return
      }

      await nextTick()
      control.removeItem(index)
    }

    return {
      ...control,
      selectedIndex,
      addAndSelect,
      pendingRemoveIndex,
      pendingRemoveLabel,
      askRemove,
      cancelRemove,
      confirmRemove,
    }
  },
})

export default layoutRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(4, uiTypeIs('ListWithDetail')),
}
</script>
