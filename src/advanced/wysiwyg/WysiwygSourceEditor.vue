<template lang="pug">
  .flex.flex-col.gap-2.p-2(data-wysiwyg-source)
    u-textarea.w-full(
      v-model="draft"
      :rows="10"
      autoresize
      :maxrows="30"
      :readonly="!editable"
      :aria-label="contentType === 'json' ? 'Source JSON' : 'Source HTML'"
      :ui="{ base: 'font-mono text-xs' }"
    )
    u-alert(v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="error")
    .flex.items-center.gap-1
      u-button(v-if="editable" size="xs" icon="i-lucide-check" @click="apply") Appliquer
      u-button(size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="$emit('close')") Retour à l’éditeur
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import { parseWysiwygSource, serializeWysiwygSource } from './source'

/**
 * Raw HTML / JSON editing. Applied content goes through the Tiptap schema, which
 * drops any element or attribute the editor does not model (scripts included).
 */
export default defineComponent({
  name: 'WysiwygSourceEditor',
  components: { UAlert, UButton, UTextarea },
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
    contentType: { type: String as PropType<'html' | 'json'>, default: 'html' },
    editable: { type: Boolean, default: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const draft = ref(serializeWysiwygSource(props.editor, props.contentType))
    const error = ref<string | null>(null)

    const apply = () => {
      const parsed = parseWysiwygSource(draft.value, props.contentType)
      if ('error' in parsed) {
        error.value = parsed.error
        return
      }
      try {
        props.editor.commands.setContent(parsed.content, {
          emitUpdate: true,
          // HTML is filtered by the schema like pasted content; unknown JSON nodes
          // would otherwise silently wipe the document, so they are rejected.
          errorOnInvalidContent: props.contentType === 'json',
        })
      } catch (err) {
        error.value = err instanceof Error ? err.message : String(err)
        return
      }
      error.value = null
      emit('close')
    }

    return { draft, error, apply }
  },
})
</script>
