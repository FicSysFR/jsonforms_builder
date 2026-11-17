<template lang="pug">
  .space-y-4
    p.text-sm.text-muted(v-if="!element" v-text="t('jsonformsBuilder.builder.inspector.empty')")

    template(v-else)
      .flex.flex-wrap.items-center.gap-2
        u-badge(:label="element.type" color="neutral" variant="subtle" size="sm")
        u-badge(
          v-if="controlKind !== 'unknown' && (propertyPath || element.type === 'ListWithDetail')"
          :label="controlKind"
          color="primary"
          variant="subtle"
          size="sm"
        )

      //- ── Control path (JSON Forms scope) ──────────────────────────────────
      template(v-if="hasEditableScope")
        u-form-field(
          :label="t('jsonformsBuilder.builder.inspector.path')"
          :help="t('jsonformsBuilder.builder.inspector.pathHelp')"
        )
          u-input(
            :model-value="scopeInput"
            class="w-full font-mono text-xs"
            :placeholder="t('jsonformsBuilder.builder.inspector.pathPlaceholder')"
            @update:model-value="onScopeInput"
          )

      //- ── Label ────────────────────────────────────────────────────────────
      template(v-if="element.type === 'Label'")
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.text')")
          u-input(
            :model-value="element.text ?? ''"
            class="w-full"
            @update:model-value="patchElement({ text: $event })"
          )
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.headingLevel')" help="h1 … h6")
          u-input-number(
            :model-value="Number(options.level ?? 3)"
            :min="1"
            :max="6"
            class="w-full"
            @update:model-value="patchOption('level', $event ?? 3)"
          )
        u-checkbox(
          :model-value="options.separator !== false"
          :label="t('jsonformsBuilder.builder.inspector.labelSeparator')"
          @update:model-value="patchOption('separator', $event)"
        )

      //- ── Group / Category label ───────────────────────────────────────────
      template(v-else-if="hasOwnLabel")
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.label')")
          u-input(
            :model-value="element.label ?? ''"
            class="w-full"
            @update:model-value="patchElement({ label: $event })"
          )

        template(v-if="element.type === 'Category'")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.categoryId')" :help="t('jsonformsBuilder.builder.inspector.categoryIdHelp')")
            u-input(
              :model-value="options.queryId ?? ''"
              class="w-full"
              @update:model-value="patchOption('queryId', $event)"
            )

      //- ── Categorization ───────────────────────────────────────────────────
      template(v-if="element.type === 'Categorization'")
        p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.categorization')")
        u-checkbox(
          :model-value="options.variant === 'stepper'"
          :label="t('jsonformsBuilder.builder.inspector.stepper')"
          @update:model-value="patchOption('variant', $event ? 'stepper' : undefined)"
        )
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.queryKey')" help="options.queryKey")
          u-input(
            :model-value="options.queryKey ?? ''"
            placeholder="tab"
            class="w-full"
            @update:model-value="patchOption('queryKey', $event)"
          )
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.defaultTab')" help="options.defaultTab")
          u-input(
            :model-value="options.defaultTab ?? ''"
            placeholder="0"
            class="w-full"
            @update:model-value="patchOption('defaultTab', $event)"
          )

      //- ── Schema-backed control / ListWithDetail ───────────────────────────
      template(v-if="propertyPath && schemaProperty")
        u-form-field(:label="t('jsonformsBuilder.builder.inspector.label')")
          u-input(
            :model-value="schemaProperty.title ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ title: $event })"
          )

        u-form-field(:label="t('jsonformsBuilder.builder.inspector.description')" :help="t('jsonformsBuilder.builder.inspector.descriptionHelp')")
          u-input(
            :model-value="schemaProperty.description ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ description: $event })"
          )

        u-checkbox(
          :model-value="required"
          :label="t('jsonformsBuilder.builder.inspector.required')"
          @update:model-value="$emit('update:required', propertyPath, $event)"
        )

        //- Schema constraints
        template(v-if="isNumeric")
          .grid.grid-cols-2.gap-2
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.minimum')")
              u-input-number(
                :model-value="schemaProperty.minimum"
                class="w-full"
                @update:model-value="patchProperty({ minimum: $event ?? undefined })"
              )
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.maximum')")
              u-input-number(
                :model-value="schemaProperty.maximum"
                class="w-full"
                @update:model-value="patchProperty({ maximum: $event ?? undefined })"
              )
          u-form-field(v-if="controlKind === 'slider'" :label="t('jsonformsBuilder.builder.inspector.multipleOf')")
            u-input-number(
              :model-value="schemaProperty.multipleOf"
              class="w-full"
              @update:model-value="patchProperty({ multipleOf: $event ?? undefined })"
            )

        u-form-field(v-if="showsMaxLength" :label="t('jsonformsBuilder.builder.inspector.maxLength')")
          u-input-number(
            :model-value="schemaProperty.maxLength"
            class="w-full"
            @update:model-value="patchProperty({ maxLength: $event ?? undefined })"
          )

        u-form-field(
          v-if="showsEnumEditor"
          :label="t('jsonformsBuilder.builder.inspector.enumOptions')"
          :help="t('jsonformsBuilder.builder.inspector.enumOptionsHelp')"
        )
          u-textarea(
            :model-value="enumText"
            :rows="4"
            class="w-full"
            @update:model-value="patchEnum($event)"
          )

        //- ── Options communes ───────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.common')")
          u-form-field(v-if="showsPlaceholder" :label="t('jsonformsBuilder.builder.inspector.placeholder')")
            u-input(
              :model-value="options.placeholder ?? ''"
              class="w-full"
              @update:model-value="patchOption('placeholder', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.leadingIcon')" :help="t('jsonformsBuilder.builder.inspector.leadingIconHelp')")
            u-input(
              :model-value="options.leadingIcon ?? ''"
              placeholder="i-lucide-mail"
              class="w-full"
              @update:model-value="patchOption('leadingIcon', $event || undefined)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.trailingIcon')" :help="t('jsonformsBuilder.builder.inspector.trailingIconHelp')")
            u-input(
              :model-value="options.trailingIcon ?? ''"
              placeholder="i-lucide-check"
              class="w-full"
              @update:model-value="patchOption('trailingIcon', $event || undefined)"
            )
          u-checkbox(
            :model-value="options.iconPlacement === 'inside'"
            :label="t('jsonformsBuilder.builder.inspector.iconsInside')"
            @update:model-value="patchOption('iconPlacement', $event ? 'inside' : undefined)"
          )
          u-checkbox(
            :model-value="!!options.focus"
            :label="t('jsonformsBuilder.builder.inspector.autofocus')"
            @update:model-value="patchOption('focus', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.readonly"
            :label="t('jsonformsBuilder.builder.inspector.readonly')"
            @update:model-value="patchOption('readonly', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.hideRequiredAsterisk"
            :label="t('jsonformsBuilder.builder.inspector.hideRequiredAsterisk')"
            @update:model-value="patchOption('hideRequiredAsterisk', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.showUnfocusedDescription"
            :label="t('jsonformsBuilder.builder.inspector.showUnfocusedDescription')"
            @update:model-value="patchOption('showUnfocusedDescription', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.hideDescription"
            :label="t('jsonformsBuilder.builder.inspector.hideDescription')"
            @update:model-value="patchOption('hideDescription', $event || undefined)"
          )
          u-checkbox(
            :model-value="options.clearOnHide === false"
            :label="t('jsonformsBuilder.builder.inspector.keepValueWhenHidden')"
            @update:model-value="patchOption('clearOnHide', $event ? false : undefined)"
          )
          u-checkbox(
            :model-value="!!options.enableFilterErrorsBeforeTouch"
            :label="t('jsonformsBuilder.builder.inspector.hideErrorsBeforeTouch')"
            @update:model-value="patchOption('enableFilterErrorsBeforeTouch', $event || undefined)"
          )
          u-checkbox(
            v-if="showsClearable"
            :model-value="!!options.clearable"
            :label="t('jsonformsBuilder.builder.inspector.clearable')"
            @update:model-value="patchOption('clearable', $event || undefined)"
          )

        //- ── String ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'string' || controlKind === 'password'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.text')")
          u-checkbox(
            :model-value="!!options.restrict"
            :label="t('jsonformsBuilder.builder.inspector.restrict')"
            @update:model-value="patchOption('restrict', $event || undefined)"
          )

        //- ── Textarea ───────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'textarea'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.textarea')")
          .grid.grid-cols-2.gap-2
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.minRows')")
              u-input-number(
                :model-value="asNumber(options.minRows)"
                class="w-full"
                @update:model-value="patchOption('minRows', $event ?? undefined)"
              )
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.maxRows')")
              u-input-number(
                :model-value="asNumber(options.rows)"
                class="w-full"
                @update:model-value="patchOption('rows', $event ?? undefined)"
              )

        //- ── Number ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'number'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.number')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.step')")
            u-input-number(
              :model-value="asNumber(options.step)"
              class="w-full"
              @update:model-value="patchOption('step', $event ?? undefined)"
            )

        //- ── Boolean ────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'boolean'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.boolean')")
          u-checkbox(
            :model-value="!!options.toggle"
            :label="t('jsonformsBuilder.builder.inspector.toggle')"
            @update:model-value="patchOption('toggle', $event || undefined)"
          )

        //- ── Enum / radio / select / multi-enum ─────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="isEnumLike")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.choice')")
          u-form-field(
            v-if="controlKind !== 'multi-enum'"
            :label="t('jsonformsBuilder.builder.inspector.presentation')"
            :help="t('jsonformsBuilder.builder.inspector.presentationHelp')"
          )
            u-select(
              :model-value="enumPresentation"
              :items="enumPresentationItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchEnumPresentation($event)"
            )
          u-form-field(
            v-if="controlKind === 'radio' || controlKind === 'multi-enum'"
            :label="t('jsonformsBuilder.builder.inspector.orientation')"
          )
            u-select(
              :model-value="orientationValue"
              :items="orientationItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchOrientation($event)"
            )

        //- ── Pin ────────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'pin'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.pin')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.pinLength')")
            u-input-number(
              :model-value="asNumber(options.length)"
              class="w-full"
              @update:model-value="patchOption('length', $event ?? undefined)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.pinType')")
            u-select(
              :model-value="options.type === 'number' ? 'number' : 'text'"
              :items="pinTypeItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchOption('type', $event === 'text' ? undefined : $event)"
            )
          u-checkbox(
            :model-value="!!options.mask"
            :label="t('jsonformsBuilder.builder.inspector.mask')"
            @update:model-value="patchOption('mask', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.otp"
            :label="t('jsonformsBuilder.builder.inspector.otp')"
            @update:model-value="patchOption('otp', $event || undefined)"
          )

        //- ── Color ──────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'color'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.color')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.colorFormat')")
            u-select(
              :model-value="options.colorFormat ?? 'hex'"
              :items="colorFormatItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchOption('colorFormat', $event === 'hex' ? undefined : $event)"
            )
          u-checkbox(
            :model-value="options.showInput !== false"
            :label="t('jsonformsBuilder.builder.inspector.showInput')"
            @update:model-value="patchOption('showInput', $event ? undefined : false)"
          )

        //- ── File ───────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'file'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.file')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.accept')")
            u-input(
              :model-value="options.accept ?? ''"
              placeholder="image/*,.pdf"
              class="w-full"
              @update:model-value="patchOption('accept', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.dropLabel')")
            u-input(
              :model-value="options.dropLabel ?? ''"
              class="w-full"
              @update:model-value="patchOption('dropLabel', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.dropDescription')")
            u-input(
              :model-value="options.dropDescription ?? ''"
              class="w-full"
              @update:model-value="patchOption('dropDescription', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.fileLayout')")
            u-input(
              :model-value="options.layout ?? ''"
              placeholder="list"
              class="w-full"
              @update:model-value="patchOption('layout', $event)"
            )

        //- ── Rating ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'rating'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.rating')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.ratingLength')")
            u-input-number(
              :model-value="asNumber(options.length)"
              class="w-full"
              @update:model-value="patchOption('length', $event ?? undefined)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.ratingIcon')")
            u-input(
              :model-value="options.icon ?? ''"
              placeholder="i-lucide-star"
              class="w-full"
              @update:model-value="patchOption('icon', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.ratingEmptyIcon')")
            u-input(
              :model-value="options.emptyIcon ?? ''"
              class="w-full"
              @update:model-value="patchOption('emptyIcon', $event)"
            )
          u-checkbox(
            :model-value="!!options.hideValue"
            :label="t('jsonformsBuilder.builder.inspector.hideValue')"
            @update:model-value="patchOption('hideValue', $event || undefined)"
          )

        //- ── Tags ───────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'tags'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.tags')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.tagsDelimiter')" :help="t('jsonformsBuilder.builder.inspector.tagsDelimiterHelp')")
            u-input(
              :model-value="options.delimiter ?? ''"
              placeholder=","
              class="w-full"
              @update:model-value="patchOption('delimiter', $event)"
            )

        //- ── Date / calendar ────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="isDateLike")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.date')")
          u-checkbox(
            v-if="controlKind === 'calendar'"
            :model-value="!!options.range"
            :label="t('jsonformsBuilder.builder.inspector.range')"
            @update:model-value="patchOption('range', $event || undefined)"
          )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.datePattern')")
            u-input(
              :model-value="options.pattern ?? ''"
              placeholder="YYYY-MM-DD"
              class="w-full"
              @update:model-value="patchOption('pattern', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.dateLocale')")
            u-input(
              :model-value="options.locale ?? ''"
              :placeholder="t('jsonformsBuilder.locale')"
              class="w-full"
              @update:model-value="patchOption('locale', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.months')")
            u-input-number(
              :model-value="asNumber(options.months)"
              class="w-full"
              @update:model-value="patchOption('months', $event ?? undefined)"
            )
          u-checkbox(
            :model-value="!!options.weekNumbers"
            :label="t('jsonformsBuilder.builder.inspector.weekNumbers')"
            @update:model-value="patchOption('weekNumbers', $event || undefined)"
          )
          .grid.grid-cols-2.gap-2
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.minDate')")
              u-input(
                :model-value="options.minDate ?? ''"
                placeholder="YYYY-MM-DD"
                class="w-full"
                @update:model-value="patchOption('minDate', $event)"
              )
            u-form-field(:label="t('jsonformsBuilder.builder.inspector.maxDate')")
              u-input(
                :model-value="options.maxDate ?? ''"
                placeholder="YYYY-MM-DD"
                class="w-full"
                @update:model-value="patchOption('maxDate', $event)"
              )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.disabledDates')" :help="t('jsonformsBuilder.builder.inspector.disabledDatesHelp')")
            u-textarea(
              :model-value="listOptionText('disabledDates')"
              :rows="3"
              class="w-full"
              @update:model-value="patchStringListOption('disabledDates', $event)"
            )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.disabledWeekdays')" :help="t('jsonformsBuilder.builder.inspector.disabledWeekdaysHelp')")
            u-textarea(
              :model-value="numberListOptionText('disabledWeekdays')"
              :rows="2"
              class="w-full"
              @update:model-value="patchNumberListOption('disabledWeekdays', $event)"
            )

        //- ── WYSIWYG ────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'wysiwyg'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.wysiwyg')")
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.contentType')" :help="t('jsonformsBuilder.builder.inspector.contentTypeHelp')")
            u-select(
              :model-value="options.contentType === 'html' || options.contentType === 'markdown' ? options.contentType : 'json'"
              :items="wysiwygContentItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchWysiwygContentType($event)"
            )

        //- ── Array / ListWithDetail ─────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'array'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed(v-text="t('jsonformsBuilder.builder.inspector.section.array')")
          u-checkbox(
            :model-value="!!options.showSortButtons"
            :label="t('jsonformsBuilder.builder.inspector.sortButtons')"
            @update:model-value="patchOption('showSortButtons', $event || undefined)"
          )
          u-form-field(:label="t('jsonformsBuilder.builder.inspector.elementLabelProp')" help="elementLabelProp")
            u-input(
              :model-value="options.elementLabelProp ?? ''"
              placeholder="label"
              class="w-full"
              @update:model-value="patchOption('elementLabelProp', $event)"
            )
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue'
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import {
  isDateLikeKind,
  isEnumLikeKind,
  resolveControlKind,
  type BuilderControlKind,
} from './controlKind'
import { formatPropertyPathInput, getSchemaPropertyAtPath, propertyPathFromScope } from './tree'
import { useUiText } from '../i18n/ui'

/** UISchema types that carry their own label, independent of the schema. */
const SELF_LABELLED = ['Group', 'Category']

const SCOPE_EDITABLE = new Set(['Control', 'ListWithDetail'])

/**
 * Panel for editing the selected element and its renderer options.
 *
 * Does not mutate anything itself: it emits intents (`update:element`, `update:property`,
 * `update:required`, `update:scope`); the root component alone owns the history stack.
 */
export default defineComponent({
  name: 'BuilderInspector',
  components: {
    UBadge,
    UCheckbox,
    UFormField,
    UInput,
    UInputNumber,
    USelect,
    UTextarea,
  },
  props: {
    element: {
      type: Object as PropType<UISchemaElement | undefined>,
      default: undefined,
    },
    /** Nested path segments, e.g. `['adresse', 'rue']`. Preferred over `property`. */
    propertyPath: {
      type: Array as PropType<string[] | undefined>,
      default: undefined,
    },
    /** @deprecated Root-only leaf name; kept so a stale HMR parent still works. */
    property: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    schema: {
      type: Object as PropType<JsonSchema>,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:element', 'update:property', 'update:control', 'update:required', 'update:scope'],
  setup(props, { emit }) {
    const t = useUiText()

    /** Prefer `propertyPath`; fall back to legacy root `property` during HMR mismatches. */
    const propertyPath = computed(() =>
      props.propertyPath?.length
        ? props.propertyPath
        : props.property
          ? [props.property]
          : undefined,
    )

    const schemaProperty = computed<JsonSchema | undefined>(() =>
      propertyPath.value?.length
        ? getSchemaPropertyAtPath(props.schema, propertyPath.value)
        : undefined,
    )

    const hasEditableScope = computed(() => SCOPE_EDITABLE.has(props.element?.type ?? ''))

    const scopeInput = computed(() => {
      const scope = (props.element as ControlElement | undefined)?.scope
      const path = propertyPathFromScope(scope)
      return path ? formatPropertyPathInput(path) : (scope?.replace(/^#\//, '') ?? '')
    })

    const onScopeInput = (value: unknown) => {
      emit('update:scope', String(value ?? ''))
    }

    const options = computed<Record<string, unknown>>(
      () => (props.element as ControlElement | undefined)?.options ?? {},
    )

    const controlKind = computed<BuilderControlKind>(() =>
      resolveControlKind(schemaProperty.value, options.value, props.element?.type),
    )

    const hasOwnLabel = computed(() => SELF_LABELLED.includes(props.element?.type ?? ''))

    const isNumeric = computed(() =>
      ['number', 'integer'].includes(String(schemaProperty.value?.type)),
    )

    const isDateLike = computed(() => isDateLikeKind(controlKind.value))
    const isEnumLike = computed(() => isEnumLikeKind(controlKind.value))

    const showsMaxLength = computed(
      () =>
        controlKind.value === 'string' ||
        controlKind.value === 'textarea' ||
        controlKind.value === 'password' ||
        controlKind.value === 'pin',
    )

    const showsEnumEditor = computed(
      () =>
        !!schemaProperty.value?.enum ||
        controlKind.value === 'multi-enum' ||
        controlKind.value === 'enum' ||
        controlKind.value === 'radio' ||
        controlKind.value === 'select',
    )

    const showsPlaceholder = computed(
      () =>
        controlKind.value !== 'boolean' &&
        controlKind.value !== 'slider' &&
        controlKind.value !== 'rating' &&
        controlKind.value !== 'wysiwyg' &&
        controlKind.value !== 'array' &&
        controlKind.value !== 'object' &&
        controlKind.value !== 'calendar',
    )

    const showsClearable = computed(
      () => controlKind.value === 'rating' || controlKind.value === 'color',
    )

    const itemsSchema = computed<JsonSchema | undefined>(() => {
      const items = schemaProperty.value?.items
      if (!items || Array.isArray(items)) {
        return undefined
      }
      return items
    })

    /** One enum value per line. */
    const enumText = computed(() => {
      const direct = schemaProperty.value?.enum
      if (direct?.length) {
        return direct.map(String).join('\n')
      }
      return (itemsSchema.value?.enum ?? []).map(String).join('\n')
    })

    const enumPresentationItems = computed(() => [
      { label: t('jsonformsBuilder.builder.inspector.presentationMenu'), value: 'menu' },
      { label: t('jsonformsBuilder.builder.inspector.presentationSelect'), value: 'select' },
      { label: t('jsonformsBuilder.builder.inspector.presentationRadio'), value: 'radio' },
    ])

    const enumPresentation = computed(() => {
      if (controlKind.value === 'radio' || options.value.format === 'radio') return 'radio'
      if (controlKind.value === 'select' || options.value.format === 'select') return 'select'
      return 'menu'
    })

    const orientationItems = computed(() => [
      { label: t('jsonformsBuilder.builder.inspector.orientationVertical'), value: 'vertical' },
      { label: t('jsonformsBuilder.builder.inspector.orientationHorizontal'), value: 'horizontal' },
    ])

    const orientationValue = computed(() => {
      if (options.value.orientation === 'horizontal' || options.value.vertical === false) {
        return 'horizontal'
      }
      return 'vertical'
    })

    const pinTypeItems = computed(() => [
      { label: t('jsonformsBuilder.builder.inspector.pinTypeText'), value: 'text' },
      { label: t('jsonformsBuilder.builder.inspector.pinTypeNumber'), value: 'number' },
    ])

    const colorFormatItems = [
      { label: 'hex', value: 'hex' },
      { label: 'rgb', value: 'rgb' },
      { label: 'hsl', value: 'hsl' },
      { label: 'cmyk', value: 'cmyk' },
      { label: 'lab', value: 'lab' },
    ]

    const wysiwygContentItems = [
      { label: 'JSON (ProseMirror)', value: 'json' },
      { label: 'HTML', value: 'html' },
      { label: 'Markdown', value: 'markdown' },
    ]

    const asNumber = (value: unknown): number | undefined =>
      typeof value === 'number' && !Number.isNaN(value) ? value : undefined

    const listOptionText = (key: string): string => {
      const value = options.value[key]
      return Array.isArray(value) ? value.map(String).join('\n') : ''
    }

    const numberListOptionText = (key: string): string => {
      const value = options.value[key]
      return Array.isArray(value) ? value.map(String).join('\n') : ''
    }

    const patchElement = (patch: Record<string, unknown>) => {
      emit('update:element', patch)
    }

    const patchProperty = (patch: Partial<JsonSchema>) => {
      emit('update:property', patch)
    }

    /**
     * Replace uischema options wholesale.
     * Keeps explicit `false` (e.g. clearOnHide, showInput, vertical).
     */
    const patchOption = (key: string, value: unknown) => {
      const next = { ...options.value }

      if (value === undefined || value === '') {
        delete next[key]
      } else {
        next[key] = value
      }

      emit('update:element', { options: next })
    }

    const patchStringListOption = (key: string, raw: string) => {
      const values = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      patchOption(key, values.length ? values : undefined)
    }

    const patchNumberListOption = (key: string, raw: string) => {
      const values = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !Number.isNaN(n))
      patchOption(key, values.length ? values : undefined)
    }

    const patchEnum = (value: string) => {
      const values = value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      if (controlKind.value === 'multi-enum') {
        const currentItems = itemsSchema.value ?? { type: 'string' }
        emit('update:property', {
          items: {
            ...currentItems,
            enum: values.length ? values : undefined,
          },
        })
        return
      }

      emit('update:property', { enum: values.length ? values : undefined })
    }

    const patchEnumPresentation = (value: unknown) => {
      const next = String(value)
      if (next === 'menu') {
        patchOption('format', undefined)
        return
      }
      patchOption('format', next)
    }

    const patchOrientation = (value: unknown) => {
      const next = { ...options.value }
      delete next.vertical
      delete next.orientation

      if (value === 'horizontal') {
        next.orientation = 'horizontal'
      }

      emit('update:element', { options: next })
    }

    /** contentType drives both the option and the schema `type` (object vs string). */
    const patchWysiwygContentType = (value: unknown) => {
      const contentType = value === 'html' || value === 'markdown' ? value : 'json'
      emit('update:control', {
        element: { options: { ...options.value, contentType } },
        property: { type: contentType === 'json' ? 'object' : 'string' },
      })
    }

    return {
      t,
      propertyPath,
      schemaProperty,
      hasEditableScope,
      scopeInput,
      onScopeInput,
      options,
      controlKind,
      hasOwnLabel,
      isNumeric,
      isDateLike,
      isEnumLike,
      showsMaxLength,
      showsEnumEditor,
      showsPlaceholder,
      showsClearable,
      enumText,
      enumPresentation,
      enumPresentationItems,
      orientationValue,
      orientationItems,
      pinTypeItems,
      colorFormatItems,
      wysiwygContentItems,
      asNumber,
      listOptionText,
      numberListOptionText,
      patchElement,
      patchProperty,
      patchOption,
      patchStringListOption,
      patchNumberListOption,
      patchEnum,
      patchEnumPresentation,
      patchOrientation,
      patchWysiwygContentType,
    }
  },
})
</script>
