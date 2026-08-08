<template lang="pug">
  .flex.items-end.justify-center.gap-1
    .flex.flex-col.items-center.gap-1
      span.text-xs.text-muted H
      u-input-number(
        v-bind="uiProps('timeHour')"
        :model-value="hour"
        :min="0"
        :max="23"
        :step="1"
        size="sm"
        orientation="vertical"
        :format-options="pad"
        class="w-16"
        @update:model-value="onHour"
      )
    span.pb-2.text-muted :
    .flex.flex-col.items-center.gap-1
      span.text-xs.text-muted M
      u-input-number(
        v-bind="uiProps('timeMinute')"
        :model-value="minute"
        :min="0"
        :max="59"
        :step="1"
        size="sm"
        orientation="vertical"
        :format-options="pad"
        class="w-16"
        @update:model-value="onMinute"
      )
    template(v-if="showSeconds")
      span.pb-2.text-muted :
      .flex.flex-col.items-center.gap-1
        span.text-xs.text-muted S
        u-input-number(
          v-bind="uiProps('timeSecond')"
          :model-value="second"
          :min="0"
          :max="59"
          :step="1"
          size="sm"
          orientation="vertical"
          :format-options="pad"
          class="w-16"
          @update:model-value="onSecond"
        )
</template>

<script lang="ts">
import { defineComponent, type Component, type PropType } from 'vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'

type UiPropsFn = (slot?: string) => Record<string, unknown>

const emptyUiProps: UiPropsFn = () => ({})

/**
 * TimePicker
 *
 * Spinners heure / minute / seconde (`UInputNumber` vertical) — équivalent pratique de
 * `q-time` pour les popovers date / heure Nuxt UI.
 */
const timePicker: Component = defineComponent({
  name: 'TimePicker',
  components: {
    UInputNumber,
  },
  props: {
    hour: {
      type: Number,
      required: true as const,
    },
    minute: {
      type: Number,
      required: true as const,
    },
    second: {
      type: Number,
      required: true as const,
    },
    showSeconds: {
      type: Boolean,
      default: false,
    },
    uiProps: {
      type: Function as PropType<UiPropsFn>,
      default: () => emptyUiProps,
    },
  },
  emits: {
    'update:hour': (_value: number) => true,
    'update:minute': (_value: number) => true,
    'update:second': (_value: number) => true,
  },
  setup(props, { emit }) {
    const pad = { minimumIntegerDigits: 2, useGrouping: false } as const

    const normalize = (value: number | null | undefined, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback

    const onHour = (value: number | null | undefined) => {
      emit('update:hour', normalize(value, props.hour))
    }

    const onMinute = (value: number | null | undefined) => {
      emit('update:minute', normalize(value, props.minute))
    }

    const onSecond = (value: number | null | undefined) => {
      emit('update:second', normalize(value, props.second))
    }

    return { pad, onHour, onMinute, onSecond }
  },
})

export default timePicker
</script>
