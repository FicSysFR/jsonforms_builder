<template lang="pug">
  u-modal(
    :open="open"
    :title="title"
    :description="description"
    :dismissible="true"
    @update:open="$emit('update:open', $event)"
  )
    template(#footer)
      .flex.w-full.items-center.justify-end.gap-2
        u-button(
          :label="cancelLabel"
          color="neutral"
          variant="ghost"
          @click="$emit('update:open', false)"
        )
        u-button(
          :label="confirmLabel"
          :color="danger ? 'error' : 'primary'"
          @click="$emit('confirm')"
        )
</template>

<script lang="ts">
import { defineComponent, type Component } from 'vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import UButton from '@nuxt/ui/components/Button.vue'

/**
 * ConfirmDialog
 *
 * Petite modale de confirmation, montée **une fois par conteneur** plutôt qu'une par
 * ligne : une liste de trente entrées n'a pas besoin de trente modales dans le DOM.
 * L'appelant retient donc l'élément visé (index ou chemin) le temps de la confirmation.
 *
 * Purement présentationnelle : elle n'agit pas, elle émet `confirm`.
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
      default: 'Confirmer la suppression',
    },
    description: {
      required: false as const,
      type: String,
      default: 'Cette action est irréversible.',
    },
    confirmLabel: {
      required: false as const,
      type: String,
      default: 'Supprimer',
    },
    cancelLabel: {
      required: false as const,
      type: String,
      default: 'Annuler',
    },
    /** Colore l'action de confirmation en rouge. */
    danger: {
      required: false as const,
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:open', 'confirm'],
})

export default confirmDialog
</script>
