<template lang="pug">
  .builder-node
    //- Drop zone before the element.
    .h-2.rounded.transition-colors(
      :class="dropTarget === 'before' ? 'bg-primary/60' : 'bg-transparent'"
      @dragover.prevent="dropTarget = 'before'"
      @dragleave="dropTarget = null"
      @drop.prevent="onDropSibling($event, index)"
    )

    .rounded-md.border.transition-colors(
      :class="[isSelected ? 'border-primary bg-primary/5' : 'border-default hover:border-inverted/20']"
      draggable="true"
      @click.stop="$emit('select', path)"
      @dragstart.stop="onDragStart"
      @dragend="dropTarget = null"
    )
      .flex.items-center.gap-2.p-2
        u-icon.shrink-0.cursor-grab.text-dimmed(name="i-lucide-grip-vertical")
        u-icon.shrink-0(:name="nodeIcon" :class="isSelected ? 'text-primary' : 'text-muted'")
        span.truncate.text-sm(v-text="nodeLabel")
        u-badge(v-if="badge" :label="badge" color="neutral" variant="subtle" size="sm")
        .flex-1
        .flex.shrink-0.items-center(class="gap-0.5")
          u-button(
            icon="i-lucide-chevron-up"
            aria-label="Monter"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.stop="$emit('shift', path, -1)"
          )
          u-button(
            icon="i-lucide-chevron-down"
            aria-label="Descendre"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.stop="$emit('shift', path, 1)"
          )
          u-button(
            icon="i-lucide-trash-2"
            aria-label="Supprimer"
            color="error"
            variant="ghost"
            size="xs"
            @click.stop="$emit('remove', path)"
          )

      //- Children. The dashed zone lets you fill an empty container.
      //- HorizontalLayout keeps siblings on one row so the canvas matches the runtime layout.
      .border-t.border-default.p-2.pl-6(
        v-if="children"
        :class="isHorizontal ? 'flex flex-wrap items-stretch gap-2' : 'space-y-1'"
      )
        builder-node(
          v-for="(child, childIndex) in children"
          :key="`${path.join('-')}-${childIndex}`"
          :class="isHorizontal ? 'min-w-40 flex-1' : undefined"
          :element="child"
          :path="[...path, childIndex]"
          :index="childIndex"
          :is-last="childIndex === children.length - 1"
          :selected-path="selectedPath"
          :schema="schema"
          @select="$emit('select', $event)"
          @remove="$emit('remove', $event)"
          @shift="(p, d) => $emit('shift', p, d)"
          @drop-item="$emit('drop-item', $event)"
        )

        .rounded.border.border-dashed.text-center.text-xs.transition-colors(
          :class="insideDropClass"
          @dragover.prevent="dropTarget = 'inside'"
          @dragleave="dropTarget = null"
          @drop.prevent="onDropInside"
        ) Déposer ici

    //- Drop zone after the last sibling: without it, you cannot append to the list.
    .h-2.rounded.transition-colors(
      v-if="isLast"
      :class="dropTarget === 'after' ? 'bg-primary/60' : 'bg-transparent'"
      @dragover.prevent="dropTarget = 'after'"
      @dragleave="dropTarget = null"
      @drop.prevent="onDropSibling($event, index + 1)"
    )
</template>

<script lang="ts">
import { computed, defineComponent, ref, type PropType } from 'vue'
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import {
  isSamePath,
  getSchemaPropertyAtPath,
  propertyPathFromScope,
  type ElementPath,
} from './tree'
import { readDragPayload, writeDragPayload } from './drag'

const NODE_ICONS: Record<string, string> = {
  Control: 'i-lucide-square-pen',
  VerticalLayout: 'i-lucide-rows-2',
  HorizontalLayout: 'i-lucide-columns-2',
  Group: 'i-lucide-square-dashed',
  Categorization: 'i-lucide-panels-top-left',
  Category: 'i-lucide-panel-top',
  Label: 'i-lucide-heading',
  ListWithDetail: 'i-lucide-panel-left',
}

/**
 * Node in the form builder edit tree.
 *
 * Recursive — hence the explicit `name: 'BuilderNode'`, without which the component
 * cannot reference itself in its own template.
 */
export default defineComponent({
  name: 'BuilderNode',
  components: {
    UBadge,
    UButton,
    UIcon,
  },
  props: {
    element: {
      type: Object as PropType<UISchemaElement>,
      required: true,
    },
    path: {
      type: Array as PropType<ElementPath>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    isLast: {
      type: Boolean,
      default: false,
    },
    selectedPath: {
      type: Array as PropType<ElementPath | null>,
      default: null,
    },
    /** Current schema, only used to display the readable title of a `Control`. */
    schema: {
      type: Object as PropType<JsonSchema | undefined>,
      default: undefined,
    },
  },
  emits: ['select', 'remove', 'shift', 'drop-item'],
  setup(props, { emit }) {
    /** Which drop zone is hovered, so only one is highlighted at a time. */
    const dropTarget = ref<'before' | 'after' | 'inside' | null>(null)

    const children = computed<UISchemaElement[] | undefined>(
      () => (props.element as { elements?: UISchemaElement[] }).elements,
    )

    const isHorizontal = computed(() => props.element.type === 'HorizontalLayout')

    const insideDropClass = computed(() => [
      isHorizontal.value ? 'flex min-w-28 shrink-0 items-center justify-center px-3 py-2' : 'py-2',
      dropTarget.value === 'inside' ? 'border-primary text-primary' : 'border-default text-dimmed',
    ])

    const isSelected = computed(
      () => !!props.selectedPath && isSamePath(props.selectedPath, props.path),
    )

    const nodeIcon = computed(() => NODE_ICONS[props.element.type] ?? 'i-lucide-box')

    const nodeLabel = computed(() => {
      const element = props.element as ControlElement & { label?: string; text?: string }
      const path = propertyPathFromScope(element.scope)

      // For a `Control`, the readable label lives in the schema (`title`) rather than
      // in the uischema: without this resolution, the tree would show only technical names.
      const title = path?.length
        ? (
            getSchemaPropertyAtPath(props.schema ?? { type: 'object' }, path) as
              | JsonSchema
              | undefined
          )?.title
        : undefined

      return (
        element.label ??
        element.text ??
        title ??
        (path ? path[path.length - 1] : undefined) ??
        element.type
      )
    })

    const badge = computed(() =>
      props.element.type === 'Control' ? undefined : props.element.type,
    )

    const onDragStart = (event: DragEvent) => {
      writeDragPayload(event, { kind: 'move', path: props.path })
    }

    const dispatchDrop = (event: DragEvent, parentPath: ElementPath, index: number) => {
      dropTarget.value = null

      const payload = readDragPayload(event)
      if (!payload) return

      emit('drop-item', { payload, parentPath, index })
    }

    /** Drop between siblings: the targeted parent is this node's parent. */
    const onDropSibling = (event: DragEvent, index: number) => {
      dispatchDrop(event, props.path.slice(0, -1), index)
    }

    /** Drop inside this container, at the last position. */
    const onDropInside = (event: DragEvent) => {
      dispatchDrop(event, props.path, children.value?.length ?? 0)
    }

    return {
      dropTarget,
      children,
      isHorizontal,
      insideDropClass,
      isSelected,
      nodeIcon,
      nodeLabel,
      badge,
      onDragStart,
      onDropSibling,
      onDropInside,
    }
  },
})
</script>
