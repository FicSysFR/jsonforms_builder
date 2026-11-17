<template lang="pug">
  .flex.flex-wrap.items-center.gap-1.border-b.border-default.bg-default.p-1(
    role="search"
    data-wysiwyg-find
    @keydown.esc.stop.prevent="$emit('close')"
  )
    u-input.w-40(
      v-model="term"
      size="xs"
      icon="i-lucide-search"
      :placeholder="t('jsonformsBuilder.wysiwyg.find.search')"
      :aria-label="t('jsonformsBuilder.wysiwyg.find.search')"
      autofocus
      @keydown.enter.prevent="next"
    )
    u-button(
      size="xs"
      :color="caseSensitive ? 'primary' : 'neutral'"
      :variant="caseSensitive ? 'soft' : 'ghost'"
      icon="i-lucide-case-sensitive"
      :aria-label="t('jsonformsBuilder.wysiwyg.find.caseSensitive')"
      :aria-pressed="caseSensitive"
      @click="caseSensitive = !caseSensitive"
    )
    span.min-w-12.text-xs.text-muted.tabular-nums(aria-live="polite") {{ counter }}
    u-button(
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-up"
      :aria-label="t('jsonformsBuilder.wysiwyg.find.previous')"
      :disabled="!total"
      @click="previous"
    )
    u-button(
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-chevron-down"
      :aria-label="t('jsonformsBuilder.wysiwyg.find.next')"
      :disabled="!total"
      @click="next"
    )
    template(v-if="editable")
      u-input.w-40(
        v-model="replacement"
        size="xs"
        icon="i-lucide-replace"
        :placeholder="t('jsonformsBuilder.wysiwyg.find.replaceWith')"
        :aria-label="t('jsonformsBuilder.wysiwyg.find.replaceWith')"
        @keydown.enter.prevent="replace"
      )
      u-button(size="xs" color="neutral" variant="outline" :disabled="!total" @click="replace") {{ t('jsonformsBuilder.wysiwyg.find.replace') }}
      u-button(size="xs" color="neutral" variant="outline" :disabled="!total" @click="replaceAll") {{ t('jsonformsBuilder.wysiwyg.find.replaceAll') }}
    u-button.ms-auto(
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      :aria-label="t('jsonformsBuilder.wysiwyg.close')"
      @click="$emit('close')"
    )
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref, watch, type PropType } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { useUiText } from '../../i18n/ui'
import { getWysiwygSearchState, scrollToCurrentSearchResult } from './search'

export default defineComponent({
  name: 'WysiwygFindReplace',
  components: { UButton, UInput },
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
    editable: { type: Boolean, default: true },
  },
  emits: ['close'],
  setup(props) {
    const t = useUiText()
    const term = ref('')
    const replacement = ref('')
    const caseSensitive = ref(false)
    const revision = ref(0)

    const onTransaction = () => {
      revision.value++
    }
    props.editor.on('transaction', onTransaction)

    const search = computed(() => {
      void revision.value
      return getWysiwygSearchState(props.editor.state)
    })
    const total = computed(() => search.value.results.length)
    const counter = computed(() =>
      total.value ? `${search.value.current + 1}/${total.value}` : term.value ? '0/0' : '',
    )

    watch(term, (value) => {
      props.editor.commands.setSearchTerm(value)
      scrollToCurrentSearchResult(props.editor)
    })
    watch(caseSensitive, (value) => props.editor.commands.setSearchCaseSensitive(value))

    const next = () => {
      props.editor.commands.nextSearchResult()
      scrollToCurrentSearchResult(props.editor)
    }
    const previous = () => {
      props.editor.commands.previousSearchResult()
      scrollToCurrentSearchResult(props.editor)
    }
    const replace = () => {
      if (props.editable) props.editor.commands.replaceSearchResult(replacement.value)
    }
    const replaceAll = () => {
      if (props.editable) props.editor.commands.replaceAllSearchResults(replacement.value)
    }

    onBeforeUnmount(() => {
      props.editor.off('transaction', onTransaction)
      if (!props.editor.isDestroyed) props.editor.commands.setSearchTerm('')
    })

    return {
      t,
      term,
      replacement,
      caseSensitive,
      total,
      counter,
      next,
      previous,
      replace,
      replaceAll,
    }
  },
})
</script>
