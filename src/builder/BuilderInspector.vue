<template lang="pug">
  .space-y-4
    p.text-sm.text-muted(v-if="!element") Sélectionnez un élément pour l'éditer.

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
          label="Chemin"
          help="Pointeur vers la propriété, ex. properties/adresse/properties/rue"
        )
          u-input(
            :model-value="scopeInput"
            class="w-full font-mono text-xs"
            placeholder="properties/monChamp"
            @update:model-value="onScopeInput"
          )

      //- ── Label ────────────────────────────────────────────────────────────
      template(v-if="element.type === 'Label'")
        u-form-field(label="Texte")
          u-input(
            :model-value="element.text ?? ''"
            class="w-full"
            @update:model-value="patchElement({ text: $event })"
          )
        u-form-field(label="Niveau de titre" help="h1 … h6")
          u-input-number(
            :model-value="Number(options.level ?? 3)"
            :min="1"
            :max="6"
            class="w-full"
            @update:model-value="patchOption('level', $event ?? 3)"
          )
        u-checkbox(
          :model-value="options.separator !== false"
          label="Séparateur"
          @update:model-value="patchOption('separator', $event)"
        )

      //- ── Group / Category label ───────────────────────────────────────────
      template(v-else-if="hasOwnLabel")
        u-form-field(label="Libellé")
          u-input(
            :model-value="element.label ?? ''"
            class="w-full"
            @update:model-value="patchElement({ label: $event })"
          )

        template(v-if="element.type === 'Category'")
          u-form-field(label="Identifiant d'onglet" help="options.queryId — stable dans l'URL")
            u-input(
              :model-value="options.queryId ?? ''"
              class="w-full"
              @update:model-value="patchOption('queryId', $event)"
            )

      //- ── Categorization ───────────────────────────────────────────────────
      template(v-if="element.type === 'Categorization'")
        p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — onglets
        u-checkbox(
          :model-value="options.variant === 'stepper'"
          label="Mode stepper (assistant)"
          @update:model-value="patchOption('variant', $event ? 'stepper' : undefined)"
        )
        u-form-field(label="Clé URL" help="options.queryKey")
          u-input(
            :model-value="options.queryKey ?? ''"
            placeholder="tab"
            class="w-full"
            @update:model-value="patchOption('queryKey', $event)"
          )
        u-form-field(label="Onglet initial" help="options.defaultTab")
          u-input(
            :model-value="options.defaultTab ?? ''"
            placeholder="0"
            class="w-full"
            @update:model-value="patchOption('defaultTab', $event)"
          )

      //- ── Schema-backed control / ListWithDetail ───────────────────────────
      template(v-if="propertyPath && schemaProperty")
        u-form-field(label="Libellé")
          u-input(
            :model-value="schemaProperty.title ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ title: $event })"
          )

        u-form-field(label="Description" help="Texte d'aide affiché sous le champ")
          u-input(
            :model-value="schemaProperty.description ?? ''"
            class="w-full"
            @update:model-value="patchProperty({ description: $event })"
          )

        u-checkbox(
          :model-value="required"
          label="Champ obligatoire"
          @update:model-value="$emit('update:required', propertyPath, $event)"
        )

        //- Schema constraints
        template(v-if="isNumeric")
          .grid.grid-cols-2.gap-2
            u-form-field(label="Minimum")
              u-input-number(
                :model-value="schemaProperty.minimum"
                class="w-full"
                @update:model-value="patchProperty({ minimum: $event ?? undefined })"
              )
            u-form-field(label="Maximum")
              u-input-number(
                :model-value="schemaProperty.maximum"
                class="w-full"
                @update:model-value="patchProperty({ maximum: $event ?? undefined })"
              )
          u-form-field(v-if="controlKind === 'slider'" label="Pas (multipleOf)")
            u-input-number(
              :model-value="schemaProperty.multipleOf"
              class="w-full"
              @update:model-value="patchProperty({ multipleOf: $event ?? undefined })"
            )

        u-form-field(v-if="showsMaxLength" label="Longueur maximale")
          u-input-number(
            :model-value="schemaProperty.maxLength"
            class="w-full"
            @update:model-value="patchProperty({ maxLength: $event ?? undefined })"
          )

        u-form-field(
          v-if="showsEnumEditor"
          label="Options"
          help="Une valeur par ligne"
        )
          u-textarea(
            :model-value="enumText"
            :rows="4"
            class="w-full"
            @update:model-value="patchEnum($event)"
          )

        //- ── Options communes ───────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options communes
          u-form-field(v-if="showsPlaceholder" label="Texte indicatif")
            u-input(
              :model-value="options.placeholder ?? ''"
              class="w-full"
              @update:model-value="patchOption('placeholder', $event)"
            )
          u-checkbox(
            :model-value="!!options.focus"
            label="Autofocus"
            @update:model-value="patchOption('focus', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.readonly"
            label="Lecture seule"
            @update:model-value="patchOption('readonly', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.hideRequiredAsterisk"
            label="Masquer l'astérisque requis"
            @update:model-value="patchOption('hideRequiredAsterisk', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.showUnfocusedDescription"
            label="Description toujours visible"
            @update:model-value="patchOption('showUnfocusedDescription', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.hideDescription"
            label="Masquer la description"
            @update:model-value="patchOption('hideDescription', $event || undefined)"
          )
          u-checkbox(
            :model-value="options.clearOnHide === false"
            label="Conserver la valeur si masqué (clearOnHide: false)"
            @update:model-value="patchOption('clearOnHide', $event ? false : undefined)"
          )
          u-checkbox(
            :model-value="!!options.enableFilterErrorsBeforeTouch"
            label="Masquer les erreurs avant interaction"
            @update:model-value="patchOption('enableFilterErrorsBeforeTouch', $event || undefined)"
          )
          u-checkbox(
            v-if="showsClearable"
            :model-value="!!options.clearable"
            label="Effaçable (clearable)"
            @update:model-value="patchOption('clearable', $event || undefined)"
          )

        //- ── String ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'string' || controlKind === 'password'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — texte
          u-checkbox(
            :model-value="!!options.restrict"
            label="Compteur maxLength (restrict)"
            @update:model-value="patchOption('restrict', $event || undefined)"
          )

        //- ── Textarea ───────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'textarea'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — texte long
          .grid.grid-cols-2.gap-2
            u-form-field(label="Lignes min")
              u-input-number(
                :model-value="asNumber(options.minRows)"
                class="w-full"
                @update:model-value="patchOption('minRows', $event ?? undefined)"
              )
            u-form-field(label="Lignes max")
              u-input-number(
                :model-value="asNumber(options.rows)"
                class="w-full"
                @update:model-value="patchOption('rows', $event ?? undefined)"
              )

        //- ── Number ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'number'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — nombre
          u-form-field(label="Pas (step)")
            u-input-number(
              :model-value="asNumber(options.step)"
              class="w-full"
              @update:model-value="patchOption('step', $event ?? undefined)"
            )

        //- ── Boolean ────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'boolean'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — booléen
          u-checkbox(
            :model-value="!!options.toggle"
            label="Interrupteur (toggle → USwitch)"
            @update:model-value="patchOption('toggle', $event || undefined)"
          )

        //- ── Enum / radio / select / multi-enum ─────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="isEnumLike")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — choix
          u-form-field(
            v-if="controlKind !== 'multi-enum'"
            label="Présentation"
            help="Défaut = liste avec recherche (USelectMenu)"
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
            label="Orientation"
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
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — PIN
          u-form-field(label="Nombre de cellules")
            u-input-number(
              :model-value="asNumber(options.length)"
              class="w-full"
              @update:model-value="patchOption('length', $event ?? undefined)"
            )
          u-form-field(label="Type de saisie")
            u-select(
              :model-value="options.type === 'number' ? 'number' : 'text'"
              :items="pinTypeItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchOption('type', $event === 'text' ? undefined : $event)"
            )
          u-checkbox(
            :model-value="!!options.mask"
            label="Masquer les caractères"
            @update:model-value="patchOption('mask', $event || undefined)"
          )
          u-checkbox(
            :model-value="!!options.otp"
            label="Autocomplete OTP SMS"
            @update:model-value="patchOption('otp', $event || undefined)"
          )

        //- ── Color ──────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'color'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — couleur
          u-form-field(label="Format de sortie")
            u-select(
              :model-value="options.colorFormat ?? 'hex'"
              :items="colorFormatItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchOption('colorFormat', $event === 'hex' ? undefined : $event)"
            )
          u-checkbox(
            :model-value="options.showInput !== false"
            label="Afficher le champ texte"
            @update:model-value="patchOption('showInput', $event ? undefined : false)"
          )

        //- ── File ───────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'file'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — fichier
          u-form-field(label="Types acceptés (accept)")
            u-input(
              :model-value="options.accept ?? ''"
              placeholder="image/*,.pdf"
              class="w-full"
              @update:model-value="patchOption('accept', $event)"
            )
          u-form-field(label="Titre zone de dépôt")
            u-input(
              :model-value="options.dropLabel ?? ''"
              class="w-full"
              @update:model-value="patchOption('dropLabel', $event)"
            )
          u-form-field(label="Sous-texte zone de dépôt")
            u-input(
              :model-value="options.dropDescription ?? ''"
              class="w-full"
              @update:model-value="patchOption('dropDescription', $event)"
            )
          u-form-field(label="Layout")
            u-input(
              :model-value="options.layout ?? ''"
              placeholder="list"
              class="w-full"
              @update:model-value="patchOption('layout', $event)"
            )

        //- ── Rating ─────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'rating'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — note
          u-form-field(label="Nombre d'icônes")
            u-input-number(
              :model-value="asNumber(options.length)"
              class="w-full"
              @update:model-value="patchOption('length', $event ?? undefined)"
            )
          u-form-field(label="Icône remplie")
            u-input(
              :model-value="options.icon ?? ''"
              placeholder="i-lucide-star"
              class="w-full"
              @update:model-value="patchOption('icon', $event)"
            )
          u-form-field(label="Icône vide")
            u-input(
              :model-value="options.emptyIcon ?? ''"
              class="w-full"
              @update:model-value="patchOption('emptyIcon', $event)"
            )
          u-checkbox(
            :model-value="!!options.hideValue"
            label="Masquer la valeur numérique"
            @update:model-value="patchOption('hideValue', $event || undefined)"
          )

        //- ── Tags ───────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'tags'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — étiquettes
          u-form-field(label="Séparateur" help="Défaut : virgule")
            u-input(
              :model-value="options.delimiter ?? ''"
              placeholder=","
              class="w-full"
              @update:model-value="patchOption('delimiter', $event)"
            )

        //- ── Date / calendar ────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="isDateLike")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — date
          u-checkbox(
            v-if="controlKind === 'calendar'"
            :model-value="!!options.range"
            label="Sélection de plage (range)"
            @update:model-value="patchOption('range', $event || undefined)"
          )
          u-form-field(label="Pattern dayjs")
            u-input(
              :model-value="options.pattern ?? ''"
              placeholder="YYYY-MM-DD"
              class="w-full"
              @update:model-value="patchOption('pattern', $event)"
            )
          u-form-field(label="Locale")
            u-input(
              :model-value="options.locale ?? ''"
              placeholder="fr-FR"
              class="w-full"
              @update:model-value="patchOption('locale', $event)"
            )
          u-form-field(label="Nombre de mois")
            u-input-number(
              :model-value="asNumber(options.months)"
              class="w-full"
              @update:model-value="patchOption('months', $event ?? undefined)"
            )
          u-checkbox(
            :model-value="!!options.weekNumbers"
            label="Numéros de semaine"
            @update:model-value="patchOption('weekNumbers', $event || undefined)"
          )
          .grid.grid-cols-2.gap-2
            u-form-field(label="Date min")
              u-input(
                :model-value="options.minDate ?? ''"
                placeholder="YYYY-MM-DD"
                class="w-full"
                @update:model-value="patchOption('minDate', $event)"
              )
            u-form-field(label="Date max")
              u-input(
                :model-value="options.maxDate ?? ''"
                placeholder="YYYY-MM-DD"
                class="w-full"
                @update:model-value="patchOption('maxDate', $event)"
              )
          u-form-field(label="Jours exclus" help="YYYY-MM-DD, un par ligne")
            u-textarea(
              :model-value="listOptionText('disabledDates')"
              :rows="3"
              class="w-full"
              @update:model-value="patchStringListOption('disabledDates', $event)"
            )
          u-form-field(label="Jours de semaine exclus" help="0=dim … 6=sam, un par ligne")
            u-textarea(
              :model-value="numberListOptionText('disabledWeekdays')"
              :rows="2"
              class="w-full"
              @update:model-value="patchNumberListOption('disabledWeekdays', $event)"
            )

        //- ── WYSIWYG ────────────────────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'wysiwyg'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — texte riche
          u-form-field(label="Format stocké" help="options.contentType — adapte aussi le type du schema")
            u-select(
              :model-value="options.contentType === 'html' ? 'html' : 'json'"
              :items="wysiwygContentItems"
              value-key="value"
              class="w-full"
              @update:model-value="patchWysiwygContentType($event)"
            )

        //- ── Array / ListWithDetail ─────────────────────────────────────────
        .space-y-3.border-t.border-default.pt-3(v-if="controlKind === 'array'")
          p.text-xs.font-semibold.uppercase.tracking-wide.text-dimmed Options — liste
          u-checkbox(
            :model-value="!!options.showSortButtons"
            label="Boutons monter / descendre"
            @update:model-value="patchOption('showSortButtons', $event || undefined)"
          )
          u-form-field(label="Propriété titre d'élément" help="elementLabelProp")
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
import {
  formatPropertyPathInput,
  getSchemaPropertyAtPath,
  propertyPathFromScope,
} from './tree'

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

    const enumPresentationItems = [
      { label: 'Liste (recherche)', value: 'menu' },
      { label: 'Liste simple', value: 'select' },
      { label: 'Boutons radio', value: 'radio' },
    ]

    const enumPresentation = computed(() => {
      if (controlKind.value === 'radio' || options.value.format === 'radio') return 'radio'
      if (controlKind.value === 'select' || options.value.format === 'select') return 'select'
      return 'menu'
    })

    const orientationItems = [
      { label: 'Vertical', value: 'vertical' },
      { label: 'Horizontal', value: 'horizontal' },
    ]

    const orientationValue = computed(() => {
      if (options.value.orientation === 'horizontal' || options.value.vertical === false) {
        return 'horizontal'
      }
      return 'vertical'
    })

    const pinTypeItems = [
      { label: 'Texte', value: 'text' },
      { label: 'Nombre', value: 'number' },
    ]

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
      const contentType = value === 'html' ? 'html' : 'json'
      emit('update:control', {
        element: { options: { ...options.value, contentType } },
        property: { type: contentType === 'html' ? 'string' : 'object' },
      })
    }

    return {
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
