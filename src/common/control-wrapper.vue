<template lang="pug">
  //- Description is always passed, not tied to focus.
  //-
  //- `UFormField` mounts its bottom row with `v-if`: revealing it on focus makes it
  //- appear in the flow and pushes everything below down one line — the flicker seen
  //- when tabbing through a form. Rendering it permanently reserves space once, and
  //- makes help readable without clicking into the field.
  //-
  //- This overrides the JSONForms default (`showUnfocusedDescription: false`) on purpose:
  //- that default is exactly what caused the layout shift.
  u-form-field(
    v-if="visible"
    v-bind="uiProps ? uiProps('formField') : {}"
    :id="id"
    :name="id"
    :label="fieldLabel"
    :help="description || undefined"
    :error="errors || undefined"
    :required="showAsterisk"
    :class="styles.control.root"
    :ui="fieldUi"
  )
    //- Phantom label (line height only). The real label stays on the checkbox:
    //- `aria-hidden` avoids double announcement to screen readers.
    template(v-if="reserveLabelSpace" #label)
      span(aria-hidden="true") &nbsp;

    //- Wrap only the control: `flex` on the `UFormField` container (which also holds
    //- `help`) aligned the description to the right of the checkbox.
    div(v-if="reserveLabelSpace" class="min-h-8 flex items-center w-full")
      slot(name="default")
    template(v-else)
      slot(name="default")
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import type { Theme } from '../theme'

/**
 * ControlWrapper
 *
 * Common wrapper for all controls, built on `UFormField`.
 *
 * In v1 each control carried its own label, hint, and error message *in addition* to
 * the wrapper — hence systematic duplication. Here `UFormField` alone is responsible for
 * label, required asterisk, help text, and error; the control renders only its input in
 * the default slot.
 *
 * @example
 * <control-wrapper v-bind="controlWrapper" :styles="styles">
 *   <u-input v-model="value" />
 * </control-wrapper>
 */
export default defineComponent({
  name: 'ControlWrapperCommonComponent',
  components: {
    UFormField,
  },
  props: {
    /** Unique field id, also used as `name` for `UForm` binding. */
    id: {
      required: true,
      type: String,
    },

    /** Help text shown below the field. */
    description: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Validation error message. */
    errors: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Field label. */
    label: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Shows or hides the entire field. */
    visible: {
      required: false as const,
      type: Boolean,
      default: true,
    },

    /** Required field per JSON Schema. */
    required: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /**
     * Shows the description. Driven by the control's `showDescription()`, which hides
     * help at rest unless `showUnfocusedDescription` is enabled.
     */
    showDescription: {
      required: false as const,
      type: Boolean,
      default: true,
    },

    /**
     * Reserves an empty label line when the control carries its own label.
     *
     * Aligns checkboxes with neighboring fields in a horizontal layout, instead of
     * letting them float at their label height.
     */
    reserveLabelSpace: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /** Hides the required-field asterisk (`hideRequiredAsterisk` option). */
    hideRequiredAsterisk: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /** Resolved theme for this element. */
    styles: {
      required: true,
      type: Object as PropType<Theme>,
    },

    /** Access to free uischema props (`options.formField`). */
    uiProps: {
      required: false as const,
      type: Function as PropType<(path: string) => Record<string, unknown>>,
      default: undefined,
    },
  },
  computed: {
    /**
     * `UFormField` renders the asterisk itself: do NOT use JSONForms' `computeLabel`,
     * which would concatenate it to the label and duplicate it.
     *
     * With `reserveLabelSpace`, the visible label is on the checkbox: an asterisk on the
     * phantom row would float alone — we suppress it here.
     */
    showAsterisk(): boolean {
      if (this.reserveLabelSpace) {
        return false
      }

      return this.required && !this.hideRequiredAsterisk
    },

    /**
     * Label passed to `UFormField`.
     *
     * With `reserveLabelSpace`: a non-breaking space forces the label row (same height as
     * neighbors). An empty / `undefined` `label` is not enough — `UFormField` only mounts
     * its label wrapper when `label` is truthy, and `:label="undefined"` does not override
     * an upstream `v-bind` (mergeProps ignores `undefined`).
     */
    fieldLabel(): string | undefined {
      if (this.reserveLabelSpace) {
        return '\u00A0'
      }

      return this.label
    },

    /**
     * Passes through uischema `ui` overrides.
     *
     * Height / centering for `reserveLabelSpace` is on the slot wrapper (see template),
     * not on `container`: that also includes `help`.
     *
     * @see help — description is always rendered; cf. template comment.
     */
    fieldUi(): Record<string, string> {
      return this.uiProps?.('formField')?.ui ?? {}
    },
  },
})
</script>
