<template lang="pug">
  .array-list(v-if="control.visible" :id="controlWrapper.id" :class="styles.arrayList.root")
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
        @click="addItem"
      )

    p.text-sm(v-if="!items.length" :class="styles.arrayList.noData") Aucun élément.

    //- Primitive values: one row per entry, no card or title. Element label and
    //- description are identical across rows — repeating them would make the list
    //- unreadable after just a few entries.
    .space-y-1(v-else-if="isPrimitiveItems" :class="styles.arrayList.itemWrapper")
      .flex.items-start.gap-1(
        v-for="(item, index) in items"
        :key="`${control.path}-${index}`"
        :class="styles.arrayList.item"
      )
        .min-w-0.flex-1
          dispatch-renderer(
            :schema="control.schema"
            :uischema="childUiSchema"
            :path="childPath(index)"
            :enabled="control.enabled"
            :renderers="control.renderers"
            :cells="control.cells"
          )
        u-button(
          v-if="showSortButtons"
          :disabled="index === 0 || !control.enabled"
          :class="styles.arrayList.itemMoveUp"
          icon="i-lucide-chevron-up"
          aria-label="Monter l'élément"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="moveUp(index)"
        )
        u-button(
          v-if="showSortButtons"
          :disabled="index === items.length - 1 || !control.enabled"
          :class="styles.arrayList.itemMoveDown"
          icon="i-lucide-chevron-down"
          aria-label="Descendre l'élément"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="moveDown(index)"
        )
        u-button(
          :disabled="!canRemove"
          :class="styles.arrayList.itemDelete"
          icon="i-lucide-trash-2"
          aria-label="Supprimer l'élément"
          color="error"
          variant="ghost"
          size="sm"
          @click="askRemove(index)"
        )

    //- Objects: one titled card, where the visual anchor is worth the vertical cost.
    .space-y-2(v-else :class="styles.arrayList.itemWrapper")
      u-card(
        v-for="(item, index) in items"
        :key="`${control.path}-${index}`"
        :class="styles.arrayList.item"
        :ui="{ header: 'p-3 sm:px-4', body: 'p-3 sm:p-4' }"
      )
        template(#header)
          .flex.items-center.justify-between.gap-2(:class="styles.arrayList.itemToolbar")
            span.text-sm.font-medium(:class="styles.arrayList.itemLabel" v-text="itemLabel(index)")
            .flex.items-center.gap-1
              u-button(
                v-if="showSortButtons"
                :disabled="index === 0 || !control.enabled"
                :class="styles.arrayList.itemMoveUp"
                icon="i-lucide-chevron-up"
                aria-label="Monter l'élément"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="moveUp(index)"
              )
              u-button(
                v-if="showSortButtons"
                :disabled="index === items.length - 1 || !control.enabled"
                :class="styles.arrayList.itemMoveDown"
                icon="i-lucide-chevron-down"
                aria-label="Descendre l'élément"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="moveDown(index)"
              )
              u-button(
                :disabled="!canRemove"
                :class="styles.arrayList.itemDelete"
                icon="i-lucide-trash-2"
                aria-label="Supprimer l'élément"
                color="error"
                variant="ghost"
                size="xs"
                @click="askRemove(index)"
              )

        .space-y-4(:class="styles.arrayList.itemContent")
          dispatch-renderer(
            :schema="control.schema"
            :uischema="childUiSchema"
            :path="childPath(index)"
            :enabled="control.enabled"
            :renderers="control.renderers"
            :cells="control.cells"
          )

    //- A single description below the list. Scoped to the array, not each row: the
    //- element schema is shared, so repeating it would add nothing.
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
  isObjectArrayControl,
  isPrimitiveArrayControl,
} from '@jsonforms/core'
import { computed, defineComponent, nextTick, ref } from 'vue'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
  type RendererProps,
} from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import { ConfirmDialog } from '../common'
import { isCombinatorItemsArray, useArrayControl } from '../composables'

/**
 * ArrayControlRenderer
 *
 * Renders `type: "array"` properties: one card per element, with reordering and
 * removal, plus an add button respecting `minItems` / `maxItems`.
 *
 * Missing in v1 — an array there showed « No applicable renderer found », making
 * repeated entry impossible (staff rows, equipment lines…).
 *
 * `options.elementLabelProp` chooses the property used as each card's title.
 */
const controlRenderer = defineComponent({
  name: 'ArrayControlRenderer',
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

    /** Index awaiting confirmation; `null` when no modal is open. */
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

      // One tick before removing the row: the modal unmounts at the same instant, and
      // removing immediately would retrigger VueUse's default `onClickOutside`
      // (cf. the README note on `subTree`).
      await nextTick()
      control.removeItem(index)
    }

    return {
      ...control,
      pendingRemoveIndex,
      pendingRemoveLabel,
      askRemove,
      cancelRemove,
      confirmRemove,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Two distinct ranks, not a single `rankWith(2, or(...))`: `enum-and-suggestion`
   * already claims primitive arrays at rank 2 (multi-select). We only compete for object
   * arrays at that rank, and settle for rank 1 for primitives — still above default
   * without overtaking it.
   */
  tester: (uischema, schema, context) => {
    if (isObjectArrayControl(uischema, schema, context)) {
      return 2
    }

    // Array whose items are a combinator (`items: { oneOf: [...] }`): neither object
    // nor primitive in JSONForms terms, so ignored by both testers above. It is still
    // a list, each entry then handed to the combinator renderer.
    if (isCombinatorItemsArray(uischema, schema, context)) {
      return 2
    }

    return isPrimitiveArrayControl(uischema, schema, context) ? 1 : -1
  },
}
</script>
