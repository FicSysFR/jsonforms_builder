<template lang="pug">
  form.flex.flex-wrap.items-center.gap-1.border-b.border-default.bg-default.p-1(
    data-wysiwyg-link
    @submit.prevent="apply"
    @keydown.esc.stop.prevent="$emit('close')"
  )
    u-input.min-w-48.flex-1(
      v-model="href"
      size="xs"
      icon="i-lucide-link"
      placeholder="https://…"
      aria-label="Adresse du lien"
      autofocus
      :color="invalid ? 'error' : undefined"
      :highlight="invalid"
    )
    u-button(type="submit" size="xs" icon="i-lucide-check" :disabled="!href.trim()") Appliquer
    u-button(
      v-if="isLink"
      size="xs"
      color="neutral"
      variant="outline"
      icon="i-lucide-unlink"
      @click="remove"
    ) Retirer
    u-button(size="xs" color="neutral" variant="ghost" icon="i-lucide-x" aria-label="Fermer" @click="$emit('close')")
    p.w-full.text-xs.text-error(v-if="invalid" role="alert") Adresse non autorisée (http, https, mailto, tel ou relative).
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { isSafeWysiwygUrl } from './ai/sanitize'

/** Inline link editor replacing Nuxt UI's `prompt()`; rejects unsafe URL schemes. */
export default defineComponent({
  name: 'WysiwygLinkPanel',
  components: { UButton, UInput },
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const isLink = props.editor.isActive('link')
    const href = ref<string>((props.editor.getAttributes('link').href as string | undefined) ?? '')
    const invalid = ref(false)

    const apply = () => {
      const value = href.value.trim()
      if (!value) return
      if (!isSafeWysiwygUrl(value)) {
        invalid.value = true
        return
      }
      props.editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run()
      emit('close')
    }

    const remove = () => {
      props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      emit('close')
    }

    return { href, invalid, isLink, apply, remove }
  },
})
</script>
