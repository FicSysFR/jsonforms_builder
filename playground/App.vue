<template lang="pug">
u-app
  .min-h-screen.bg-default.text-default
    //- `bg-default/75` goes in an attribute: Pug cannot parse `/` in the class
    //- shorthand and dumps the rest of the line as plain text.
    header.sticky.top-0.z-10.border-b.border-default(class="bg-default/75 backdrop-blur")
      //- `flex-wrap` + `min-w-0`: in a narrow pane the toolbar wraps instead of
      //- pushing the page into horizontal overflow.
      .flex.flex-wrap.items-center.gap-2.px-4.py-3
        h1.min-w-0.truncate.text-sm.font-semibold.tracking-tight(
          title="JSONForms Builder — Nuxt UI Playground"
        ) JSONForms Builder
        u-button(
          :label="mode === 'renderers' ? 'Open builder' : 'Back to examples'"
          :icon="mode === 'renderers' ? 'i-lucide-pencil-ruler' : 'i-lucide-list'"
          color="neutral"
          variant="outline"
          size="sm"
          @click="mode = mode === 'renderers' ? 'builder' : 'renderers'"
        )
        .flex-1
        u-select(
          v-model="locale"
          :items="localeItems"
          value-key="value"
          size="sm"
          class="w-28"
        )
        u-button(
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          :aria-pressed="isDark"
          color="neutral"
          variant="ghost"
          aria-label="Toggle theme"
          @click="toggleDark()"
        )

    .p-4(v-if="mode === 'builder'")
      form-builder(v-model="builderDefinition")

    //- Single column by default, sidebar from `lg`: a fixed width from mobile
    //- would overflow the page horizontally.
    .flex.flex-col.items-stretch.gap-4.p-4(class="lg:flex-row lg:items-start" v-else)
      //- Sticky + max-height under the header: the example list scrolls
      //- independently of the form when it exceeds the viewport.
      //- The search bar stays outside the scroll area so it remains reachable.
      .flex.flex-col.gap-2(
        class="max-h-56 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-5rem)] lg:w-56 lg:shrink-0"
      )
        u-input(
          v-model="exampleQuery"
          icon="i-lucide-search"
          placeholder="Search…"
          size="sm"
          :ui="{ trailing: 'pe-1' }"
        )
          template(#trailing)
            u-button(
              v-if="exampleQuery"
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-x"
              aria-label="Clear search"
              @click="exampleQuery = ''"
            )
        nav.space-y-1.min-h-0.flex-1.overflow-y-auto
          u-button(
            v-for="item in filteredExamples"
            :key="item.name"
            :label="item.label"
            :color="item.name === example.name ? 'primary' : 'neutral'"
            :variant="item.name === example.name ? 'soft' : 'ghost'"
            size="sm"
            block
            class="justify-start"
            @click="selectExample(item.name)"
          )
          p.py-2.text-center.text-xs.text-muted(
            v-if="filteredExamples.length === 0"
          ) No examples

      .min-w-0.flex-1.space-y-3
        .flex.flex-wrap.items-center.gap-2
          u-tabs(
            v-model="inspectTab"
            :items="inspectTabs"
            value-key="value"
            size="sm"
            class="min-w-0 flex-1"
            :ui="{ list: 'w-full sm:w-auto' }"
          )
          u-button(
            v-if="inspectTab !== 'form'"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="copied ? 'Copied' : 'Copy'"
            color="neutral"
            variant="outline"
            size="sm"
            @click="copyInspectJson"
          )

        //- Keep the form mounted (`v-show`) so switching tabs does not reset field state.
        u-card(v-show="inspectTab === 'form'" :ui="{ body: 'p-6 sm:p-8' }")
          json-forms(
            :key="example.name"
            :data="data"
            :schema="example.schema"
            :uischema="example.uischema"
            :renderers="renderers"
            :i18n="i18n"
            :ajv="ajv"
            :additional-errors="additionalErrors"
            :config="{ ...example.config }"
            validation-mode="ValidateAndShow"
            @change="onChange"
          )

        u-card(v-if="inspectTab !== 'form'" :ui="{ body: 'p-0' }")
          //- `max-h-[calc(…)]` must be an attribute: Pug treats `/` as text otherwise.
          pre.overflow-auto.p-6.text-xs.leading-relaxed(
            class="max-h-[calc(100dvh-12rem)]"
            v-text="inspectJson"
          )
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from 'vue'
import { useClipboard, useDark, useToggle } from '@vueuse/core'
import { JsonForms, type JsonFormsChangeEvent } from '@jsonforms/vue'
import type { JsonFormsI18nState } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import { get } from 'radash'
import { allRenderers, createAjv, FormBuilder, type FormDefinition } from '../src'
import { getExamples } from './examples/register'

const examples = getExamples()
const renderers = Object.freeze(allRenderers)
const additionalErrors: ErrorObject[] = []
const ajv = createAjv()

/** Filters the sidebar list by example label or technical name; carried by `?q=`. */
const exampleQuery = ref(new URLSearchParams(window.location.search).get('q') ?? '')
const filteredExamples = computed(() => {
  const q = exampleQuery.value.trim().toLowerCase()
  if (!q) {
    return examples
  }
  return examples.filter(
    (item) => item.label.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
  )
})

watch(exampleQuery, (query) => {
  const params = new URLSearchParams(window.location.search)
  const trimmed = query.trim()
  if (trimmed) {
    params.set('q', trimmed)
  } else {
    params.delete('q')
  }
  const search = params.toString()
  window.history.replaceState({}, '', search ? `?${search}` : window.location.pathname)
})

const localeItems = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
]

// Outside Nuxt, `useColorMode` does not exist: Nuxt UI's color-mode plugin simply
// relies on VueUse's `useDark`, which sets the `.dark` class on <html>.
//
// Call with parentheses (`toggleDark()`): `useToggle` checks `arguments.length`
// and, if it receives anything — the `MouseEvent` from `@click="toggleDark"` —
// *assigns* it instead of toggling.
const isDark = useDark()
const toggleDark = useToggle(isDark)

const locale = ref<'fr' | 'en'>('fr')
// `unknown` rather than `Record<…>`: an example root may be an array, a scalar,
// or nothing at all — see the `watch` comment below.
const data = ref<unknown>({})

/** Toggles between the renderer gallery and the visual builder. */
const mode = ref<'renderers' | 'builder'>('renderers')
const builderDefinition = ref<Partial<FormDefinition>>({})

/** The current example is carried by `?example=` so links stay shareable. */
const selected = ref(new URLSearchParams(window.location.search).get('example') ?? '')

const example = computed(() => examples.find((e) => e.name === selected.value) ?? examples[0])

watch(
  example,
  (current) => {
    selected.value = current.name
    const params = new URLSearchParams(window.location.search)
    params.set('example', current.name)
    window.history.replaceState({}, '', `?${params.toString()}`)
    /*
     * Copy the data *while preserving its shape*.
     *
     * The previous `{ ...(current.data ?? {}) }` always forced an object: an example
     * whose root is an array became `{ 0: …, 1: … }`, and an example with no data
     * (`json-editor`) received `{}` where it declares `undefined`. The form then
     * started from a value its own schema rejects — and JSONForms' `addItem`, which
     * does `array.push` without checking, threw `array.push is not a function`.
     */
    data.value =
      current.data === undefined || current.data === null
        ? current.data
        : structuredClone(toRaw(current.data))
  },
  { immediate: true },
)

const i18n = computed<JsonFormsI18nState>(() => ({
  locale: locale.value,
  /**
   * With neither a translation nor a default message, return `''` rather than the
   * raw key (`exampleRadioEnum.description`) — JSONForms always calls the translator
   * even when the schema has no description (`defaultMessage` is `undefined`).
   */
  translate: (key: string, defaultMessage?: string) => {
    const dict = get(example.value.i18n, locale.value, {}) as Record<string, unknown>
    const translated = get(dict, key) as string | undefined
    if (translated !== undefined) {
      return translated
    }
    return defaultMessage ?? ''
  },
}))

const onChange = (event: JsonFormsChangeEvent) => {
  data.value = event.data
}

/** Top-level view for the selected example: form preview or JSON sources. */
type InspectTab = 'form' | 'data' | 'schema' | 'uischema'
const inspectTab = ref<InspectTab>('form')
const inspectTabs = [
  { label: 'Form', value: 'form' as const },
  { label: 'Data', value: 'data' as const },
  { label: 'Schema', value: 'schema' as const },
  { label: 'UI Schema', value: 'uischema' as const },
]

const inspectJson = computed(() => {
  const tab = inspectTab.value
  if (tab === 'form') {
    return ''
  }
  const value =
    tab === 'data' ? data.value : tab === 'schema' ? example.value.schema : example.value.uischema
  return JSON.stringify(value ?? null, null, 2)
})

const { copy, copied } = useClipboard({ copiedDuring: 1500 })
const copyInspectJson = () => {
  if (inspectTab.value === 'form' || !inspectJson.value) {
    return
  }
  void copy(inspectJson.value)
}

/**
 * The form is mounted with `:key="example.name"`: switching examples unmounts everything.
 *
 * Deferred by one tick, because if a dropdown was open, the same click closes it.
 * Unmounting immediately leaves VueUse's `onClickOutside` pointing at a destroyed
 * instance (`Cannot read properties of null (reading 'subTree')`).
 */
const selectExample = async (name: string) => {
  await nextTick()
  selected.value = name
  inspectTab.value = 'form'
}
</script>
