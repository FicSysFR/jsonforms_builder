<template lang="pug">
  .absolute.z-10.hidden.items-center(
    ref="handleEl"
    v-show="visible"
    class="gap-0.5 sm:flex -translate-x-full"
    :style="position"
    data-wysiwyg-block-handle
  )
    u-button(
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      size="xs"
      class="text-dimmed"
      :aria-label="t('jsonformsBuilder.wysiwyg.block.insert')"
      :title="t('jsonformsBuilder.wysiwyg.block.insert')"
      data-wysiwyg-block-insert
      @click.stop="insertBelow"
    )
    //- Drag starts on this box, not on the button: Firefox does not drag `<button>` elements.
    .relative(
      draggable="true"
      data-wysiwyg-block-drag
      @pointerdown.capture="menuWasOpen = menuOpen"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    )
      u-button(
        icon="i-lucide-grip-vertical"
        color="neutral"
        variant="ghost"
        active-variant="soft"
        size="xs"
        class="cursor-grab text-dimmed"
        :active="menuOpen"
        :aria-label="t('jsonformsBuilder.wysiwyg.block.menu')"
        :title="t('jsonformsBuilder.wysiwyg.block.menu')"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        data-wysiwyg-block-grip
        @click.stop="toggleMenu"
      )
      //- The grip handles click and drag itself: the menu only anchors on this inert box.
      u-dropdown-menu(
        :open="menuOpen"
        :modal="false"
        :items="menuItems"
        :content="{ side: 'left', align: 'start' }"
        :ui="{ content: 'w-60', label: 'text-xs' }"
        @update:open="onMenuOpenChange"
      )
        span.pointer-events-none.absolute.inset-0(aria-hidden="true")
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue'
import type { Editor } from '@tiptap/vue-3'
import type { Transaction } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { useUiText } from '../../i18n/ui'
import type { ResolvedWysiwygFeatures } from './features'
import { buildWysiwygBlockMenu, findWysiwygBlockAt, insertWysiwygBlockAfter } from './block'

/**
 * Gutter handle of the block mode, built on ProseMirror alone: it follows the top-level block
 * under the pointer, `+` inserts a block below, the grip is dragged to move the block or
 * clicked to open the block menu.
 */
export default defineComponent({
  name: 'WysiwygBlockHandle',
  components: { UButton, UDropdownMenu },
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
    features: { type: Object as PropType<ResolvedWysiwygFeatures>, required: true },
    /** `+` opens the `/` palette in the new block instead of leaving it empty. */
    slashCommands: { type: Boolean, default: false },
  },
  setup(props) {
    const t = useUiText()
    const handleEl = ref<HTMLElement | null>(null)
    const visible = ref(false)
    const menuOpen = ref(false)
    const position = ref<Record<string, string>>({})
    // Start of the top-level block the handle points at, remapped on every transaction.
    const blockPos = ref<number | null>(null)

    const view = () => (props.editor.isDestroyed ? null : props.editor.view)

    const place = () => {
      const editorView = view()
      const handle = handleEl.value
      const pos = blockPos.value
      if (!editorView || !handle || pos == null) return
      const dom = editorView.nodeDOM(pos)
      if (!(dom instanceof HTMLElement)) return
      // Measured once displayed (`nextTick`): a hidden handle has no `offsetParent`.
      const parent = (handle.offsetParent as HTMLElement | null) ?? editorView.dom
      const parentRect = parent.getBoundingClientRect()
      const rect = dom.getBoundingClientRect()
      // Centre the handle on the first line of the block (headings included).
      const lineHeight = Number.parseFloat(getComputedStyle(dom).lineHeight) || 24
      position.value = {
        top: `${Math.round(rect.top - parentRect.top + Math.max(0, (lineHeight - 24) / 2))}px`,
        left: `${Math.round(rect.left - parentRect.left - 4)}px`,
      }
    }

    let frame = 0
    const onPointerMove = (event: MouseEvent) => {
      if (menuOpen.value || dragging) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const editorView = view()
        if (!editorView?.editable) return
        // The first block starts at 0: only `null` means "no block".
        const found = findWysiwygBlockAt(editorView, event.clientY)
        if (found == null) return
        blockPos.value = found
        visible.value = true
        void nextTick(place)
      })
    }
    const hide = (event?: Event) => {
      if (menuOpen.value || dragging) return
      // Moving from the page onto the handle is not leaving the editor.
      const to = (event as MouseEvent | undefined)?.relatedTarget
      if (to instanceof Node && handleEl.value?.contains(to)) return
      visible.value = false
    }

    const onTransaction = ({ transaction }: { transaction: Transaction }) => {
      if (blockPos.value == null || !transaction.docChanged) return
      const mapped = transaction.mapping.mapResult(blockPos.value, 1)
      const node = mapped.deleted ? null : props.editor.state.doc.nodeAt(mapped.pos)
      if (!node || props.editor.state.doc.resolve(mapped.pos).depth !== 0) {
        blockPos.value = null
        visible.value = false
        menuOpen.value = false
        return
      }
      blockPos.value = mapped.pos
      requestAnimationFrame(place)
    }

    let frameRoot: HTMLElement | null = null
    onMounted(() => {
      const editorView = view()
      if (!editorView) return
      // `UEditor` root: holds both this handle (default slot) and the ProseMirror content.
      frameRoot = handleEl.value?.parentElement ?? editorView.dom
      frameRoot.addEventListener('mousemove', onPointerMove)
      frameRoot.addEventListener('mouseleave', hide)
      // Typing hides the handle, as on a page.
      editorView.dom.addEventListener('keydown', hide)
      props.editor.on('transaction', onTransaction)
    })
    onBeforeUnmount(() => {
      cancelAnimationFrame(frame)
      frameRoot?.removeEventListener('mousemove', onPointerMove)
      frameRoot?.removeEventListener('mouseleave', hide)
      if (!props.editor.isDestroyed) props.editor.view.dom.removeEventListener('keydown', hide)
      props.editor.off('transaction', onTransaction)
    })

    const canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText

    const copyBlock = () => {
      const pos = blockPos.value
      const node = pos == null ? null : props.editor.state.doc.nodeAt(pos)
      if (node) void navigator.clipboard.writeText(node.textContent).catch(() => undefined)
    }

    const menuItems = computed(() => {
      const pos = blockPos.value
      if (pos == null || !menuOpen.value || props.editor.isDestroyed) return []
      return buildWysiwygBlockMenu(
        {
          editor: props.editor,
          features: props.features,
          pos,
          onCopy: canCopy ? copyBlock : undefined,
        },
        t,
      )
    })

    // Pressing the grip of an open menu dismisses it (outside pointerdown) before the click.
    const menuWasOpen = ref(false)
    const toggleMenu = () => {
      const pos = blockPos.value
      if (pos == null || props.editor.isDestroyed) return
      if (menuOpen.value || menuWasOpen.value) {
        menuOpen.value = false
        menuWasOpen.value = false
        return
      }
      // Select the block so "turn into" entries apply to it. No `focus()`: Tiptap focuses on
      // the next frame, which would dismiss the menu as a focus outside it.
      props.editor.commands.setNodeSelection(pos)
      menuOpen.value = true
    }
    // Outside click, Escape or a picked entry close the menu; only the grip opens it.
    const onMenuOpenChange = (open: boolean) => {
      if (!open) menuOpen.value = false
    }
    watch(menuOpen, (open) => {
      if (!open) requestAnimationFrame(place)
    })

    const insertBelow = () => {
      const pos = blockPos.value
      if (pos == null || props.editor.isDestroyed) return
      insertWysiwygBlockAfter(props.editor, pos, props.slashCommands)
    }

    // Drag: ProseMirror moves `view.dragging` on drop, as for a dragged selection.
    let dragging = false
    const onDragStart = (event: DragEvent) => {
      const editorView = view()
      const pos = blockPos.value
      if (!editorView || pos == null || !event.dataTransfer) return
      menuOpen.value = false
      const selection = NodeSelection.create(editorView.state.doc, pos)
      const slice = selection.content()
      editorView.dispatch(editorView.state.tr.setSelection(selection))
      const { dom, text } = editorView.serializeForClipboard(slice)
      event.dataTransfer.clearData()
      event.dataTransfer.setData('text/html', dom.innerHTML)
      event.dataTransfer.setData('text/plain', text)
      event.dataTransfer.effectAllowed = 'copyMove'
      const blockDom = editorView.nodeDOM(pos)
      if (blockDom instanceof HTMLElement) event.dataTransfer.setDragImage(blockDom, 0, 0)
      // `node` is read by ProseMirror's drop handler but missing from its public typing.
      draggingState = { slice, move: true, node: selection }
      ;(editorView as { dragging: unknown }).dragging = draggingState
      dragging = true
    }
    // A drop in the editor clears `view.dragging`; a cancelled drag or a drop elsewhere does not
    // (the drag started outside the editor), so clear it as ProseMirror does after a drag.
    let draggingState: object | null = null
    const onDragEnd = () => {
      dragging = false
      visible.value = false
      const editorView = view()
      const mine = draggingState
      draggingState = null
      setTimeout(() => {
        const current = editorView as { dragging: unknown } | null
        if (current && current.dragging === mine) current.dragging = null
      }, 50)
    }

    return {
      t,
      handleEl,
      visible,
      position,
      menuOpen,
      menuWasOpen,
      menuItems,
      toggleMenu,
      onMenuOpenChange,
      insertBelow,
      onDragStart,
      onDragEnd,
    }
  },
})
</script>
