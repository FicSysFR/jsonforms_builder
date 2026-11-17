<template lang="pug">
  node-view-wrapper
    u-file-upload.w-full.min-h-40(
      v-model="file"
      :accept="ctx.accept"
      :label="ctx.label"
      :description="error ?? ctx.description"
      :preview="false"
      :disabled="loading"
    )
      template(#leading)
        u-avatar(
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: loading ? 'animate-spin' : undefined }"
        )
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref, watch } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import { type UiText, useUiText } from '../i18n/ui'
import { WysiwygImageUploadKey, type WysiwygImageUploadContext } from './wysiwygImageUpload'

const fallbackContext = (t: UiText): WysiwygImageUploadContext => ({
  upload: async () => {
    throw new Error(t('jsonformsBuilder.wysiwyg.imageUpload.notConfigured'))
  },
  accept: 'image/*',
  label: t('jsonformsBuilder.wysiwyg.imageUpload.label'),
  description: t('jsonformsBuilder.wysiwyg.imageUpload.formats'),
})

export default defineComponent({
  name: 'WysiwygImageUploadNode',
  components: {
    NodeViewWrapper,
    UFileUpload,
    UAvatar,
  },
  props: nodeViewProps,
  setup(props) {
    const t = useUiText()
    const injected = inject(WysiwygImageUploadKey, null)
    const ctx = computed(() => injected?.value ?? fallbackContext(t))

    const file = ref<File | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    watch(file, async (next) => {
      if (!next) return

      error.value = null
      const maxSize = ctx.value.maxSize
      if (typeof maxSize === 'number' && next.size > maxSize) {
        error.value = t('jsonformsBuilder.wysiwyg.imageUpload.tooLarge', {
          size: Math.round(maxSize / (1024 * 1024)),
        })
        file.value = null
        return
      }

      loading.value = true
      try {
        const src = await ctx.value.upload(next)
        const pos = props.getPos()
        if (typeof pos !== 'number') return

        props.editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + 1 })
          .setImage({ src, alt: next.name })
          .run()
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : t('jsonformsBuilder.wysiwyg.imageUpload.failed')
        file.value = null
      } finally {
        loading.value = false
      }
    })

    return { file, loading, error, ctx }
  },
})
</script>
