<template lang="pug">
  .form-builder.flex.flex-col.gap-3
    .flex.flex-wrap.items-center.gap-2
      .flex.shrink-0.items-center(class="gap-0.5")
        u-button(
          :disabled="!canUndo"
          icon="i-lucide-undo-2"
          label="Précédent"
          aria-label="Précédent"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="undo"
        )
        u-button(
          :disabled="!canRedo"
          icon="i-lucide-redo-2"
          label="Suivant"
          aria-label="Suivant"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="redo"
        )
        u-button(
          icon="i-lucide-upload"
          label="Importer"
          color="neutral"
          variant="outline"
          size="sm"
          @click="openImport"
        )
      .flex-1.min-w-0
      u-tabs(
        :model-value="view"
        :items="viewItems"
        value-key="value"
        size="sm"
        class="min-w-0"
        :ui="{ list: 'w-full sm:w-auto' }"
        @update:model-value="view = String($event)"
      )

    //- ── Edit ────────────────────────────────────────────────────────────────
    //- The three panels use `v-if`, not `v-show`, on purpose: `v-show` hides by
    //- writing an inline `display: none`, and a host running Tailwind in
    //- `important` mode (`@import "tailwindcss" important`, which the docs embed
    //- needs) emits `.grid { display: grid !important }` — that outranks the
    //- inline style and every panel stays visible at once. None of them keeps
    //- local state (the builder store lives in `setup`), so unmounting is free.
    .grid.grid-cols-1.gap-3(v-if="view === 'edit'" class="lg:grid-cols-[16rem_1fr_20rem]")
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
          :property-path="selectedPropertyPath"
          :schema="definition.schema"
          :required="selectedPropertyPath ? isRequired(selectedPropertyPath) : false"
          @update:element="onUpdateElement"
          @update:property="onUpdateProperty"
          @update:control="onUpdateControl"
          @update:required="setRequired"
          @update:scope="onUpdateScope"
        )

    //- ── Preview ─────────────────────────────────────────────────────────────────
    u-card(v-if="view === 'preview'")
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
    .grid.grid-cols-1.gap-3(v-if="view === 'json'" class="md:grid-cols-2 xl:grid-cols-3")
      u-card(:ui="{ body: 'p-0' }")
        template(#header)
          span.text-xs.font-semibold.uppercase.tracking-wide.text-muted Data
        pre.overflow-x-auto.p-3.text-xs(v-text="dataJson")
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

    //- Nuxt UI: default slot = DialogTrigger; body content must use `#body`.
    u-modal(
      v-model:open="importOpen"
      title="Importer un formulaire"
      description="Collez un JSON `{ schema, uischema, data? }` (ou un JSON Schema seul), ou chargez un fichier."
      :ui="{ content: 'sm:max-w-2xl' }"
    )
      template(#body)
        .space-y-3
          .flex.flex-wrap.items-center.gap-2
            u-button(
              icon="i-lucide-file-up"
              label="Charger un fichier…"
              color="neutral"
              variant="outline"
              size="sm"
              @click="fileInput?.click()"
            )
            input.hidden(
              ref="fileInput"
              type="file"
              accept="application/json,.json"
              @change="onImportFile"
            )
            p.text-xs.text-muted Fichier .json — remplace le formulaire courant

          u-form-field(label="JSON" :error="importError || undefined")
            u-textarea(
              v-model="importText"
              :rows="14"
              class="w-full font-mono text-xs"
              placeholder='{\n  "schema": { "type": "object", "properties": { … } },\n  "uischema": { "type": "VerticalLayout", "elements": [ … ] },\n  "data": { … }\n}'
              @update:model-value="importError = ''"
            )

      template(#footer)
        .flex.w-full.items-center.justify-end.gap-2
          u-button(
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="importOpen = false"
          )
          u-button(
            label="Importer"
            color="primary"
            :disabled="!importText.trim()"
            @click="applyImport"
          )
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch, type PropType } from 'vue'
import type { JsonFormsRendererRegistryEntry, UISchemaElement } from '@jsonforms/core'
import { JsonForms } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import UTabs from '@nuxt/ui/components/Tabs.vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import BuilderInspector from './BuilderInspector.vue'
import { ConfirmDialog } from '../common'
import BuilderNode from './BuilderNode.vue'
import { PALETTE_CONTAINERS, PALETTE_FIELDS } from './palette'
import { readDragPayload, writeDragPayload, type DropEvent } from './drag'
import { useFormBuilder, type FormDefinition } from './useFormBuilder'
import { FormImportError, parseFormImport } from './importForm'
import {
  DEFAULT_FORM_BUILDER_STORAGE_KEY,
  getBrowserFormDraftStorage,
  isMeaningfulDefinition,
  readFormDraft,
  writeFormDraft,
} from './persistForm'
import { allRenderers } from '../renderers'
import { getElementAt, type ElementPath } from './tree'

/**
 * FormBuilder
 *
 * Visual editor producing the `{ schema, uischema }` pair consumed by `<JsonForms>`,
 * with live preview `data` visible in the JSON tab.
 *
 * Three panels: palette, form tree, inspector — plus a Preview tab that mounts the
 * real `<JsonForms>` with v2 renderers, a read-only JSON tab (data / schema / uischema),
 * and an import dialog (paste or file upload) to load an existing definition for editing.
 *
 * By default the in-progress form (`schema`, `uischema`, preview `data`) is persisted to
 * `localStorage` so a refresh keeps the draft. Pass `:storage-key="false"` to disable.
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
    UFormField,
    UIcon,
    UModal,
    UTabs,
    UTextarea,
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
    /**
     * `localStorage` key for the draft. Default enables persistence; set to `false` to opt out.
     */
    storageKey: {
      type: [String, Boolean] as PropType<string | false>,
      default: DEFAULT_FORM_BUILDER_STORAGE_KEY,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const draftStorage = getBrowserFormDraftStorage()
    const resolvedStorageKey = computed(() =>
      props.storageKey === false ? undefined : props.storageKey || DEFAULT_FORM_BUILDER_STORAGE_KEY,
    )

    const storedDraft =
      resolvedStorageKey.value && draftStorage
        ? readFormDraft(draftStorage, resolvedStorageKey.value)
        : undefined

    const initialDefinition = isMeaningfulDefinition(props.modelValue)
      ? props.modelValue
      : (storedDraft ?? props.modelValue)

    const builder = useFormBuilder(initialDefinition)

    const view = ref<'edit' | 'preview' | 'json'>('edit')
    const viewItems = [
      { value: 'edit', label: 'Éditeur', icon: 'i-lucide-pencil-ruler' },
      { value: 'preview', label: 'Aperçu', icon: 'i-lucide-eye' },
      { value: 'json', label: 'JSON', icon: 'i-lucide-braces' },
    ]

    // Preview `data` is internal (not part of `v-model`): always rehydrate it from the
    // draft when present so remounts (playground mode switch, page reload) keep values.
    const previewData = ref<unknown>(
      storedDraft && storedDraft.data !== undefined ? structuredClone(storedDraft.data) : {},
    )
    const isRootDropActive = ref(false)

    const importOpen = ref(false)
    const importText = ref('')
    const importError = ref('')
    const fileInput = ref<HTMLInputElement | null>(null)

    /** Emitting the definition on every change makes the component usable with `v-model`. */
    watch(builder.definition, (value) => emit('update:modelValue', value), { deep: true })

    /** Keep the browser draft in sync with the editor (definition + preview data). */
    watch(
      [builder.definition, previewData, resolvedStorageKey],
      ([definition, data, key]) => {
        if (!key || !draftStorage) {
          return
        }
        writeFormDraft(draftStorage, key, {
          schema: definition.schema,
          uischema: definition.uischema,
          data,
        })
      },
      { deep: true },
    )
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
      if (builder.selectedPropertyPath.value) {
        builder.updateProperty(builder.selectedPropertyPath.value, patch)
      }
    }

    const onUpdateControl = (payload: {
      element: Record<string, unknown>
      property: Record<string, unknown>
    }) => {
      if (builder.selectedPath.value && builder.selectedPropertyPath.value) {
        builder.updateControl(
          builder.selectedPath.value,
          builder.selectedPropertyPath.value,
          payload.element,
          payload.property,
        )
      }
    }

    const onUpdateScope = (rawPath: string) => {
      if (builder.selectedPath.value) {
        builder.updateScope(builder.selectedPath.value, rawPath)
      }
    }

    const dataJson = computed(() => JSON.stringify(previewData.value, null, 2))
    const schemaJson = computed(() => JSON.stringify(builder.definition.value.schema, null, 2))
    const uischemaJson = computed(() => JSON.stringify(builder.definition.value.uischema, null, 2))

    const openImport = () => {
      importText.value = ''
      importError.value = ''
      importOpen.value = true
    }

    const applyImport = () => {
      try {
        const next = parseFormImport(importText.value)
        builder.reset(next)
        previewData.value = next.data === undefined ? {} : structuredClone(next.data)
        view.value = 'edit'
        importOpen.value = false
        importError.value = ''
      } catch (error) {
        importError.value =
          error instanceof FormImportError ? error.message : "Impossible d'importer ce formulaire."
      }
    }

    const onImportFile = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''

      if (!file) {
        return
      }

      try {
        importText.value = await file.text()
        importError.value = ''
      } catch {
        importError.value = 'Impossible de lire ce fichier.'
      }
    }

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
      onUpdateControl,
      onUpdateScope,
      dataJson,
      schemaJson,
      uischemaJson,
      importOpen,
      importText,
      importError,
      fileInput,
      openImport,
      applyImport,
      onImportFile,
    }
  },
})
</script>
