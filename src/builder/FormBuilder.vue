<template lang="pug">
  .form-builder.flex.flex-col.gap-3
    .flex.items-center.gap-2
      u-tabs(
        :model-value="view"
        :items="viewItems"
        value-key="value"
        size="sm"
        @update:model-value="view = String($event)"
      )
      .flex-1
      u-button(
        :disabled="!canUndo"
        icon="i-lucide-undo-2"
        aria-label="Annuler"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="undo"
      )
      u-button(
        :disabled="!canRedo"
        icon="i-lucide-redo-2"
        aria-label="Rétablir"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="redo"
      )

    //- ── Edit ────────────────────────────────────────────────────────────────
    .grid.grid-cols-1.gap-3(v-show="view === 'edit'" class="lg:grid-cols-[16rem_1fr_20rem]")
      u-card(:ui="{ body: 'p-3' }")
        .space-y-4
          .space-y-2(v-for="group in fieldGroups" :key="group.name")
            p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="group.name")
            .grid.grid-cols-2.gap-1
              button.flex.items-center.rounded.border.border-default.text-left.text-xs.cursor-grab(
                v-for="field in group.fields"
                :key="field.key"
                type="button"
                draggable="true"
                class="gap-1.5 p-1.5 hover:border-primary hover:bg-primary/5"
                @dragstart="onPaletteDragStart($event, 'field', field.key)"
                @click="appendField(field.key)"
              )
                u-icon.shrink-0.text-muted(:name="field.icon")
                span.truncate(v-text="field.label")

          .space-y-2
            p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Conteneurs
            .grid.grid-cols-2.gap-1
              button.flex.items-center.rounded.border.border-dashed.border-default.text-left.text-xs.cursor-grab(
                v-for="container in containers"
                :key="container.key"
                type="button"
                draggable="true"
                class="gap-1.5 p-1.5 hover:border-primary hover:bg-primary/5"
                @dragstart="onPaletteDragStart($event, 'container', container.key)"
                @click="appendContainer(container.key)"
              )
                u-icon.shrink-0.text-muted(:name="container.icon")
                span.truncate(v-text="container.label")

      u-card(:ui="{ body: 'p-3' }")
        .space-y-1(@click="select(null)")
          p.text-xs.text-dimmed.mb-2 Glissez un champ depuis la palette, ou cliquez pour l'ajouter en fin de formulaire.

          builder-node(
            v-for="(element, index) in rootElements"
            :key="`root-${index}`"
            :element="element"
            :path="[index]"
            :index="index"
            :is-last="index === rootElements.length - 1"
            :selected-path="selectedPath"
            :schema="definition.schema"
            @select="select"
            @remove="askRemove"
            @shift="shift"
            @drop-item="onDropItem"
          )

          .rounded.border.border-dashed.py-6.text-center.text-xs.transition-colors(
            :class="isRootDropActive ? 'border-primary text-primary' : 'border-default text-dimmed'"
            @dragover.prevent="isRootDropActive = true"
            @dragleave="isRootDropActive = false"
            @drop.prevent="onRootDrop"
          ) {{ rootElements.length ? 'Déposer en fin de formulaire' : 'Déposez ici votre premier champ' }}

      u-card(:ui="{ body: 'p-3' }")
        builder-inspector(
          :element="selectedElement"
          :property="selectedProperty"
          :schema="definition.schema"
          :required="selectedProperty ? isRequired(selectedProperty) : false"
          @update:element="onUpdateElement"
          @update:property="onUpdateProperty"
          @update:required="setRequired"
        )

    //- ── Preview ─────────────────────────────────────────────────────────────────
    u-card(v-show="view === 'preview'")
      json-forms(
        :key="previewKey"
        :data="previewData"
        :schema="definition.schema"
        :uischema="definition.uischema"
        :renderers="renderers"
        validation-mode="ValidateAndShow"
        @change="previewData = $event.data"
      )

    //- ── JSON ───────────────────────────────────────────────────────────────────
    .grid.grid-cols-1.gap-3(v-show="view === 'json'" class="md:grid-cols-2")
      u-card(:ui="{ body: 'p-0' }")
        template(#header)
          span.text-xs.font-semibold.uppercase.tracking-wide.text-muted JSON Schema
        pre.overflow-x-auto.p-3.text-xs(v-text="schemaJson")
      u-card(:ui="{ body: 'p-0' }")
        template(#header)
          span.text-xs.font-semibold.uppercase.tracking-wide.text-muted UI Schema
        pre.overflow-x-auto.p-3.text-xs(v-text="uischemaJson")

    confirm-dialog(
      :open="pendingRemovePath !== null"
      title="Supprimer cet élément ?"
      :description="removeDescription"
      @update:open="cancelRemove"
      @confirm="confirmRemove"
    )
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch, type PropType } from 'vue'
import type { JsonFormsRendererRegistryEntry, UISchemaElement } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTabs from '@nuxt/ui/components/Tabs.vue'
import BuilderInspector from './BuilderInspector.vue'
import { ConfirmDialog } from '../common'
import BuilderNode from './BuilderNode.vue'
import { PALETTE_CONTAINERS, PALETTE_FIELDS } from './palette'
import { readDragPayload, writeDragPayload, type DropEvent } from './drag'
import { useFormBuilder, type FormDefinition } from './useFormBuilder'
import { allRenderers } from '../renderers'
import { getElementAt, type ElementPath } from './tree'

/**
 * FormBuilder
 *
 * Visual editor producing the `{ schema, uischema }` pair consumed by `<JsonForms>`.
 *
 * Three panels: palette, form tree, inspector — plus a Preview tab that mounts the
 * real `<JsonForms>` with v2 renderers, and a read-only JSON tab.
 *
 * Raw JSON editing is deliberately absent: host applications already have their own
 * code editor (Monaco, etc.), and embedding one here would bloat the library for everyone.
 *
 * @example
 * <form-builder v-model="definition" />
 */
export default defineComponent({
  name: 'FormBuilder',
  components: {
    BuilderInspector,
    BuilderNode,
    ConfirmDialog,
    JsonForms,
    UButton,
    UCard,
    UIcon,
    UTabs,
  },
  props: {
    /** Definition being edited. Supports `v-model`. */
    modelValue: {
      type: Object as PropType<Partial<FormDefinition> | undefined>,
      default: undefined,
    },
    /** Renderers used by the preview. Defaults to the library's full set. */
    renderers: {
      type: Array as PropType<JsonFormsRendererRegistryEntry[]>,
      default: () => allRenderers,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const builder = useFormBuilder(props.modelValue)

    const view = ref<'edit' | 'preview' | 'json'>('edit')
    const viewItems = [
      { value: 'edit', label: 'Éditeur', icon: 'i-lucide-pencil-ruler' },
      { value: 'preview', label: 'Aperçu', icon: 'i-lucide-eye' },
      { value: 'json', label: 'JSON', icon: 'i-lucide-braces' },
    ]

    const previewData = ref<Record<string, unknown>>({})
    const isRootDropActive = ref(false)

    /** Emitting the definition on every change makes the component usable with `v-model`. */
    watch(builder.definition, (value) => emit('update:modelValue', value), { deep: true })

    const rootElements = computed<UISchemaElement[]>(
      () => (builder.definition.value.uischema as { elements?: UISchemaElement[] }).elements ?? [],
    )

    /**
     * Forces the preview to remount when the structure changes: `<JsonForms>` caches
     * its renderers by path, and a simple uischema mutation would leave removed fields on screen.
     */
    const previewKey = computed(
      () =>
        JSON.stringify(builder.definition.value.uischema).length +
        ':' +
        JSON.stringify(builder.definition.value.schema).length,
    )

    const fieldGroups = computed(() => {
      const groups = new Map<string, typeof PALETTE_FIELDS>()

      for (const field of PALETTE_FIELDS) {
        groups.set(field.group, [...(groups.get(field.group) ?? []), field])
      }

      return [...groups].map(([name, fields]) => ({ name, fields }))
    })

    const onPaletteDragStart = (event: DragEvent, kind: 'field' | 'container', key: string) => {
      writeDragPayload(event, { kind, key } as never)
    }

    const appendAt = (): { parentPath: ElementPath; index: number } => ({
      parentPath: [],
      index: rootElements.value.length,
    })

    const appendField = (key: string) => {
      const { parentPath, index } = appendAt()
      builder.addField(key, parentPath, index)
    }

    const appendContainer = (key: string) => {
      const { parentPath, index } = appendAt()
      builder.addContainer(key, parentPath, index)
    }

    const applyDrop = ({ payload, parentPath, index }: DropEvent) => {
      if (payload.kind === 'field') {
        builder.addField(payload.key, parentPath, index)
        return
      }

      if (payload.kind === 'container') {
        builder.addContainer(payload.key, parentPath, index)
        return
      }

      builder.move(payload.path, parentPath, index)
    }

    const onDropItem = (event: DropEvent) => {
      applyDrop(event)
    }

    const onRootDrop = (event: DragEvent) => {
      isRootDropActive.value = false

      const payload = readDragPayload(event)
      if (!payload) return

      applyDrop({ payload, parentPath: [], index: rootElements.value.length })
    }

    /** Path awaiting confirmation; `null` when no modal is open. */
    const pendingRemovePath = ref<ElementPath | null>(null)

    /**
     * Removing a container takes its descendants — and therefore their schema properties.
     * State this explicitly, since the collapsed tree does not show what will be lost.
     */
    const removeDescription = computed(() => {
      if (!pendingRemovePath.value) {
        return ''
      }

      const element = getElementAt(builder.definition.value.uischema, pendingRemovePath.value)
      const children = (element as { elements?: unknown[] } | undefined)?.elements?.length ?? 0

      return children
        ? `Cet élément et ses ${children} enfant(s) seront retirés, ainsi que les propriétés de schéma qu'ils étaient seuls à référencer.`
        : "L'élément et sa propriété de schéma seront retirés. L'action reste annulable."
    })

    const askRemove = (path: ElementPath) => {
      pendingRemovePath.value = path
    }

    const cancelRemove = () => {
      pendingRemovePath.value = null
    }

    const confirmRemove = async () => {
      const path = pendingRemovePath.value
      pendingRemovePath.value = null

      if (!path) {
        return
      }

      // One tick before unmounting: the modal closes at the same instant.
      await nextTick()
      builder.remove(path)
    }

    const onUpdateElement = (patch: Record<string, unknown>) => {
      if (builder.selectedPath.value) {
        builder.updateElement(builder.selectedPath.value, patch)
      }
    }

    const onUpdateProperty = (patch: Record<string, unknown>) => {
      if (builder.selectedProperty.value) {
        builder.updateProperty(builder.selectedProperty.value, patch)
      }
    }

    const schemaJson = computed(() => JSON.stringify(builder.definition.value.schema, null, 2))
    const uischemaJson = computed(() => JSON.stringify(builder.definition.value.uischema, null, 2))

    return {
      ...builder,
      view,
      viewItems,
      previewData,
      previewKey,
      rootElements,
      fieldGroups,
      containers: PALETTE_CONTAINERS,
      isRootDropActive,
      onPaletteDragStart,
      appendField,
      appendContainer,
      onDropItem,
      pendingRemovePath,
      removeDescription,
      askRemove,
      cancelRemove,
      confirmRemove,
      onRootDrop,
      onUpdateElement,
      onUpdateProperty,
      schemaJson,
      uischemaJson,
    }
  },
})
</script>
