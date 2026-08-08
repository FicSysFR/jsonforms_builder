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
          :label="mode === 'renderers' ? 'Open builder' : 'Back to gallery'"
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
        class="max-h-72 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-5rem)] lg:w-64 lg:shrink-0"
      )
        u-tabs(
          v-model="gallerySection"
          :items="sectionTabs"
          value-key="value"
          size="sm"
          class="w-full"
          :ui="{ list: 'w-full' }"
        )
        p.text-xs.text-muted.leading-snug {{ sectionHint }}
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
          ) {{ gallerySection === 'docs' ? 'No documentation samples' : 'No examples' }}

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
            v-if="inspectTab === 'data' || inspectTab === 'schema' || inspectTab === 'uischema'"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="copied ? 'Copied' : 'Copy'"
            color="neutral"
            variant="outline"
            size="sm"
            @click="copyInspectJson"
          )

        //- Keep the form mounted (`v-show`) so switching tabs does not reset field state.
        .space-y-4(v-show="inspectTab === 'form'")
          u-card(:ui="{ body: 'p-6 sm:p-8' }")
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
          //- Quasar-style Props API under the live demo (Documentation section only).
          u-card(
            v-if="gallerySection === 'docs' && apiGroups.length > 0"
            :ui="{ body: 'p-4 sm:p-6 space-y-1' }"
          )
            .flex.flex-wrap.items-baseline.justify-between.gap-2.mb-3
              h2.text-base.font-semibold.tracking-tight API — Options
              p.text-xs.text-muted Name · Type · Default · Description
            api-props-table(:groups="apiGroups")

        u-card(v-if="inspectTab === 'api'" :ui="{ body: 'p-4 sm:p-6' }")
          .flex.flex-wrap.items-baseline.justify-between.gap-2.mb-3
            h2.text-base.font-semibold.tracking-tight API — Options
            p.text-xs.text-muted Name · Type · Default · Description
          api-props-table(:groups="apiGroups")

        u-card(
          v-if="inspectTab === 'data' || inspectTab === 'schema' || inspectTab === 'uischema'"
          :ui="{ body: 'p-0' }"
        )
          //- `max-h-[calc(…)]` must be an attribute: Pug treats `/` as text otherwise.
          pre.overflow-auto.p-6.text-xs.leading-relaxed(
            class="max-h-[calc(100dvh-12rem)]"
            v-text="inspectJson"
          )</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from 'vue'
import { useClipboard, useDark, useToggle } from '@vueuse/core'
import { JsonForms, type JsonFormsChangeEvent } from '@jsonforms/vue'
import type { JsonFormsI18nState } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import { get } from 'radash'
import { allRenderers, createAjv, FormBuilder, type FormDefinition } from '../src'
import type { ExampleSection } from './examples/example'
import { getExamples } from './examples/register'
import ApiPropsTable from './docs-api/ApiPropsTable.vue'
import { getApiGroupsForExample } from './docs-api/props'

const examples = getExamples()
const renderers = Object.freeze(allRenderers)
const additionalErrors: ErrorObject[] = []
const ajv = createAjv()

const initialParams = new URLSearchParams(window.location.search)

/** Documentation showcases vs demo / edge-case gallery; carried by `?section=`. */
const gallerySection = ref<ExampleSection>(
  initialParams.get('section') === 'examples' ? 'examples' : 'docs',
)
const sectionTabs = [
  { label: 'Documentation', value: 'docs' as const },
  { label: 'Examples', value: 'examples' as const },
]
const sectionHint = computed(() =>
  gallerySection.value === 'docs'
    ? 'Vitrines + tableaux API (Name / Type / Default / Description).'
    : 'JSONForms demos, layouts, compositions, and edge cases.',
)

/** Filters the sidebar list by example label or technical name; carried by `?q=`. */
const exampleQuery = ref(initialParams.get('q') ?? '')

/** The current example is carried by `?example=` so links stay shareable. */
const selected = ref(initialParams.get('example') ?? '')

/** Top-level view for the selected example: form preview, API props, or JSON sources. */
type InspectTab = 'form' | 'api' | 'data' | 'schema' | 'uischema'
const inspectTab = ref<InspectTab>(initialParams.get('tab') === 'api' ? 'api' : 'form')

const filteredExamples = computed(() => {
  const inSection = examples.filter((item) => item.section === gallerySection.value)
  const q = exampleQuery.value.trim().toLowerCase()
  if (!q) {
    return inSection
  }
  return inSection.filter(
    (item) => item.label.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
  )
})

const syncGalleryParams = () => {
  const params = new URLSearchParams(window.location.search)
  params.set('section', gallerySection.value)
  const trimmed = exampleQuery.value.trim()
  if (trimmed) {
    params.set('q', trimmed)
  } else {
    params.delete('q')
  }
  if (selected.value) {
    params.set('example', selected.value)
  }
  if (inspectTab.value === 'api') {
    params.set('tab', 'api')
  } else {
    params.delete('tab')
  }
  window.history.replaceState({}, '', `?${params.toString()}`)
}

watch([exampleQuery, gallerySection, inspectTab], syncGalleryParams)

watch(gallerySection, () => {
  const stillVisible = filteredExamples.value.some((item) => item.name === selected.value)
  if (!stillVisible && filteredExamples.value[0]) {
    selected.value = filteredExamples.value[0].name
    inspectTab.value = 'form'
  }
  if (gallerySection.value !== 'docs' && inspectTab.value === 'api') {
    inspectTab.value = 'form'
  }
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

const example = computed(() => {
  const byName = examples.find((e) => e.name === selected.value)
  if (byName) {
    return byName
  }
  return examples.find((e) => e.section === gallerySection.value) ?? examples[0]
})

const apiGroups = computed(() => getApiGroupsForExample(example.value.name))

watch(
  example,
  (current) => {
    selected.value = current.name
    if (current.section && current.section !== gallerySection.value) {
      gallerySection.value = current.section
    }
    syncGalleryParams()
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

const inspectTabs = computed(() => {
  const tabs: { label: string; value: InspectTab }[] = [{ label: 'Form', value: 'form' }]
  if (gallerySection.value === 'docs') {
    tabs.push({ label: 'API', value: 'api' })
  }
  tabs.push(
    { label: 'Data', value: 'data' },
    { label: 'Schema', value: 'schema' },
    { label: 'UI Schema', value: 'uischema' },
  )
  return tabs
})

const inspectJson = computed(() => {
  const tab = inspectTab.value
  if (tab === 'form' || tab === 'api') {
    return ''
  }
  const value =
    tab === 'data' ? data.value : tab === 'schema' ? example.value.schema : example.value.uischema
  return JSON.stringify(value ?? null, null, 2)
})

const { copy, copied } = useClipboard({ copiedDuring: 1500 })
const copyInspectJson = () => {
  if (inspectTab.value === 'form' || inspectTab.value === 'api' || !inspectJson.value) {
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
