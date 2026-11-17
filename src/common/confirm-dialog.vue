<template lang="pug">
  u-modal(
    :open="open"
    :title="title ?? t('jsonformsBuilder.confirm.title')"
    :description="description ?? t('jsonformsBuilder.confirm.description')"
    :dismissible="true"
    @update:open="$emit('update:open', $event)"
  )
    template(#footer)
      .flex.w-full.items-center.justify-end.gap-2
        u-button(
          :label="cancelLabel ?? t('jsonformsBuilder.confirm.cancel')"
          color="neutral"
          variant="ghost"
          @click="$emit('update:open', false)"
        )
        u-button(
          :label="confirmLabel ?? t('jsonformsBuilder.confirm.confirm')"
          :color="danger ? 'error' : 'primary'"
          @click="$emit('confirm')"
        )
</template>

<script lang="ts">
import { defineComponent, type Component } from 'vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { useUiText } from '../i18n/ui'

/**
 * ConfirmDialog
 *
 * Small confirmation modal, mounted **once per container** rather than once per row:
 * a list of thirty entries does not need thirty modals in the DOM. The caller holds the
 * targeted item (index or path) for the duration of confirmation.
 *
 * Presentation only: it does not act; it emits `confirm`.
 */
const confirmDialog: Component = defineComponent({
  name: 'ConfirmDialog',
  components: {
    UModal,
    UButton,
  },
  props: {
    open: {
      required: false as const,
      type: Boolean,
      default: false,
    },
    title: {
      required: false as const,
      type: String,
      default: undefined,
    },
    description: {
      required: false as const,
      type: String,
      default: undefined,
    },
    confirmLabel: {
      required: false as const,
      type: String,
      default: undefined,
    },
    cancelLabel: {
      required: false as const,
      type: String,
      default: undefined,
    },
    /** Colors the confirm action red. */
    danger: {
      required: false as const,
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:open', 'confirm'],
  // Texts default to the translated `jsonformsBuilder.confirm.*` keys.
  setup() {
    return { t: useUiText() }
  },
})

export default confirmDialog
</script>
