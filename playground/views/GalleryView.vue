<template lang="pug">
//- Single column by default, sidebar from `lg`: a fixed width from mobile
//- would overflow the page horizontally.
.flex.flex-col.items-stretch.gap-4.p-4(class="lg:flex-row lg:items-start")
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
    //- `readonly` until focus: Chrome ignores `autocomplete="off"` next to
    //- OTP pin inputs (`autocomplete="one-time-code"`) and dumps a saved email here.
    u-input(
      v-model="exampleQuery"
      type="search"
      name="playground-example-filter"
      autocomplete="off"
      icon="i-lucide-search"
      placeholder="Search…"
      size="sm"
      :readonly="exampleSearchLocked"
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
      :ui="{ trailing: 'pe-1' }"
      @focus="exampleSearchLocked = false"
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
      )
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { JsonForms, type JsonFormsChangeEvent } from '@jsonforms/vue'
import type { JsonFormsI18nState } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import { get } from 'radash'
import { allRenderers, createAjv } from '../../src'
import type { ExampleSection } from '../examples/example'
import { getExamples } from '../examples/register'
import ApiPropsTable from '../docs-api/ApiPropsTable.vue'
import { getApiGroupsForExample } from '../docs-api/props'

const props = defineProps<{
  locale: 'fr' | 'en'
}>()

const route = useRoute()
const router = useRouter()

const examples = getExamples()
const renderers = Object.freeze(allRenderers)
const additionalErrors: ErrorObject[] = []
const ajv = createAjv()

const queryString = (value: unknown) => (typeof value === 'string' ? value : '')

/** Documentation showcases vs demo / edge-case gallery; carried by `?section=`. */
const gallerySection = ref<ExampleSection>(
  queryString(route.query.section) === 'examples' ? 'examples' : 'docs',
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
const exampleQuery = ref(queryString(route.query.q))

/**
 * Stay `readonly` until the user focuses the filter. Otherwise Chrome’s password
 * manager treats it as a username field when an OTP pin input mounts and autofills
 * a saved email into `exampleQuery` (and thus into `?q=`).
 */
const exampleSearchLocked = ref(true)

/** The current example is carried by `?example=` so links stay shareable. */
const selected = ref(queryString(route.query.example))

/** Top-level view for the selected example: form preview, API props, or JSON sources. */
type InspectTab = 'form' | 'api' | 'data' | 'schema' | 'uischema'
const inspectTab = ref<InspectTab>(queryString(route.query.tab) === 'api' ? 'api' : 'form')

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
  const query: Record<string, string> = {
    section: gallerySection.value,
  }
  const trimmed = exampleQuery.value.trim()
  if (trimmed) {
    query.q = trimmed
  }
  if (selected.value) {
    query.example = selected.value
  }
  if (inspectTab.value === 'api') {
    query.tab = 'api'
  }
  void router.replace({ query })
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

// `unknown` rather than `Record<…>`: an example root may be an array, a scalar,
// or nothing at all — see the `watch` comment below.
const data = ref<unknown>({})

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
  locale: props.locale,
  /**
   * With neither a translation nor a default message, return `''` rather than the
   * raw key (`exampleRadioEnum.description`) — JSONForms always calls the translator
   * even when the schema has no description (`defaultMessage` is `undefined`).
   */
  translate: (key: string, defaultMessage?: string) => {
    const dict = get(example.value.i18n, props.locale, {}) as Record<string, unknown>
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
  // Re-lock so a newly mounted OTP form cannot autofill the filter again.
  exampleSearchLocked.value = true
}
</script>
