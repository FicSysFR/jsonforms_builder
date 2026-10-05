<template lang="pug">
  .flex.flex-col.gap-2.rounded-md.border.border-default.bg-default.p-3.shadow-lg(
    role="dialog"
    :aria-label="title"
    data-wysiwyg-ai-result
    @keydown.esc.stop.prevent="ai.discard()"
  )
    .flex.items-center.gap-2.text-sm
      u-icon.size-4.text-primary(:name="ai.currentAction.value?.icon ?? 'i-lucide-sparkles'")
      span.font-medium.truncate {{ title }}
      span.ms-auto.text-xs.text-muted(aria-live="polite")
        template(v-if="status === 'generating'") {{ labels.generating }}
        template(v-else-if="status === 'done' || status === 'stopped'") {{ labels.done }}

    form.flex.gap-2(v-if="status === 'prompting'" @submit.prevent="submit")
      u-input.flex-1(
        ref="instructionInput"
        v-model="ai.instruction.value"
        :placeholder="labels.instructionPlaceholder"
        autofocus
        size="sm"
      )
      u-button(
        type="submit"
        size="sm"
        icon="i-lucide-arrow-up"
        :aria-label="labels.submit"
        :disabled="requiresInstruction && !ai.instruction.value.trim()"
      )

    .max-h-64.overflow-y-auto.whitespace-pre-wrap.break-words.rounded.bg-elevated.p-2.text-sm(
      v-if="status !== 'prompting' && status !== 'error'"
      aria-live="polite"
      data-wysiwyg-ai-preview
    )
      template(v-if="preview") {{ preview }}
      span.text-muted(v-else-if="status === 'generating'") …
      span.text-muted(v-else) {{ labels.empty }}

    p.text-xs.text-muted(v-if="ai.explanation.value") {{ ai.explanation.value }}

    u-alert(
      v-if="ai.error.value"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="status === 'error' ? labels.error : undefined"
      :description="ai.error.value"
    )

    .flex.flex-wrap.items-center.gap-1
      template(v-if="status === 'generating'")
        u-button(size="xs" color="neutral" variant="outline" icon="i-lucide-square" @click="ai.cancel()") {{ labels.stop }}
      template(v-else-if="canAccept")
        u-button(
          v-if="hasOperations"
          size="xs"
          icon="i-lucide-check"
          @click="ai.accept('operations')"
        ) {{ labels.apply }}
        u-button(
          v-if="target?.kind !== 'cursor'"
          size="xs"
          :variant="hasOperations ? 'outline' : 'solid'"
          icon="i-lucide-replace"
          @click="ai.accept('replace')"
        ) {{ target?.kind === 'block' ? labels.replaceBlock : labels.replaceSelection }}
        u-button(
          v-else
          size="xs"
          :variant="hasOperations ? 'outline' : 'solid'"
          icon="i-lucide-text-cursor-input"
          @click="ai.accept('insert')"
        ) {{ labels.insert }}
        u-button(size="xs" color="neutral" variant="outline" icon="i-lucide-list-plus" @click="ai.accept('insertBelow')") {{ labels.insertBelow }}
      u-button(
        v-if="status === 'done' || status === 'stopped' || status === 'error'"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-rotate-ccw"
        @click="ai.retry()"
      ) {{ labels.retry }}
      u-button.ms-auto(size="xs" color="neutral" variant="ghost" icon="i-lucide-x" @click="ai.discard()") {{ labels.discard }}
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue'
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import type { WysiwygAiController } from './useWysiwygAi'
import type { WysiwygAiLabels, WysiwygAiOutputFormat } from './types'

/** Plain-text view of the result: generated HTML is never rendered as markup. */
const toPreviewText = (value: string, format: WysiwygAiOutputFormat) => {
  if (format !== 'html' || typeof DOMParser === 'undefined') return value
  return new DOMParser().parseFromString(value, 'text/html').body.textContent ?? ''
}

/**
 * Detached preview of an AI result. Streaming text lands here — never in the
 * document — until the user picks how to apply it.
 */
export default defineComponent({
  name: 'WysiwygAiResult',
  components: { UAlert, UButton, UIcon, UInput },
  props: {
    ai: { type: Object as PropType<WysiwygAiController>, required: true },
    labels: { type: Object as PropType<WysiwygAiLabels>, required: true },
    format: { type: String as PropType<WysiwygAiOutputFormat>, default: 'text' },
  },
  setup(props) {
    const status = computed(() => props.ai.status.value)
    const target = computed(() => props.ai.target.value)
    const title = computed(() => props.ai.currentAction.value?.label ?? props.labels.ask)
    const preview = computed(() => toPreviewText(props.ai.result.value, props.format))
    const hasOperations = computed(() => props.ai.operations.value.length > 0)
    const canAccept = computed(
      () =>
        (status.value === 'done' || status.value === 'stopped') &&
        (!!props.ai.result.value.trim() || hasOperations.value),
    )
    // Actions without a built-in instruction (“Ask AI”) need the user's one.
    const requiresInstruction = computed(() => !props.ai.currentAction.value?.instruction)

    const submit = () => {
      const action = props.ai.currentAction.value
      if (!action || (requiresInstruction.value && !props.ai.instruction.value.trim())) return
      void props.ai.start(action, props.ai.instruction.value)
    }

    return {
      status,
      target,
      title,
      preview,
      hasOperations,
      canAccept,
      requiresInstruction,
      submit,
    }
  },
})
</script>
