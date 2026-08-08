<template lang="pug">
u-app
  .min-h-screen.bg-default.text-default
    //- `bg-default/75` va en attribut : Pug ne sait pas lire un `/` dans le raccourci
    //- de classe et recrache le reste de la ligne en texte brut.
    header.sticky.top-0.z-10.border-b.border-default(class="bg-default/75 backdrop-blur")
      //- `flex-wrap` + `min-w-0` : dans un panneau étroit la barre d'outils passe à la
      //- ligne au lieu de pousser la page en débordement horizontal.
      .flex.flex-wrap.items-center.gap-2.px-4.py-3
        h1.min-w-0.truncate.text-sm.font-semibold.tracking-tight(
          title="JSONForms Builder — Nuxt UI Playground"
        ) JSONForms Builder
        u-button(
          :label="mode === 'renderers' ? 'Ouvrir le builder' : 'Retour aux exemples'"
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
          aria-label="Basculer le thème"
          @click="toggleDark()"
        )

    .p-4(v-if="mode === 'builder'")
      form-builder(v-model="builderDefinition")

    //- Colonne unique par défaut, barre latérale à partir de `lg` : une largeur fixe
    //- imposée dès le mobile ferait déborder la page horizontalement.
    .flex.flex-col.items-stretch.gap-4.p-4(class="lg:flex-row lg:items-start" v-else)
      //- Sticky + max-height sous le header : la liste d'exemples scrolle
      //- indépendamment du formulaire quand elle dépasse la fenêtre.
      nav.space-y-1.overflow-y-auto(
        class="max-h-56 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-5rem)] lg:w-56 lg:shrink-0"
      )
        u-button(
          v-for="item in examples"
          :key="item.name"
          :label="item.label"
          :color="item.name === example.name ? 'primary' : 'neutral'"
          :variant="item.name === example.name ? 'soft' : 'ghost'"
          size="sm"
          block
          class="justify-start"
          @click="selectExample(item.name)"
        )

      .min-w-0.flex-1.space-y-4
        u-card
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

        u-card(:ui="{ body: 'p-0' }")
          template(#header)
            span.text-xs.font-semibold.uppercase.tracking-wide.text-muted Données
          pre.overflow-x-auto.p-4.text-xs(v-text="JSON.stringify(data, null, 2)")
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
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

const localeItems = [
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
]

// Hors Nuxt, `useColorMode` n'existe pas : le plugin color-mode de Nuxt UI s'appuie
// simplement sur `useDark` de VueUse, qui pose la classe `.dark` sur <html>.
//
// À appeler avec des parenthèses (`toggleDark()`) : `useToggle` teste `arguments.length`
// et, s'il reçoit quoi que ce soit — le `MouseEvent` d'un `@click="toggleDark"` —,
// l'*assigne* au lieu de basculer.
const isDark = useDark()
const toggleDark = useToggle(isDark)

const locale = ref<'fr' | 'en'>('fr')
const data = ref<Record<string, unknown>>({})

/** Bascule entre la galerie de renderers et le builder visuel. */
const mode = ref<'renderers' | 'builder'>('renderers')
const builderDefinition = ref<Partial<FormDefinition>>({})

/** L'exemple courant est porté par `?example=` pour garder les liens partageables. */
const selected = ref(new URLSearchParams(window.location.search).get('example') ?? '')

const example = computed(() => examples.find((e) => e.name === selected.value) ?? examples[0])

watch(
  example,
  (current) => {
    selected.value = current.name
    const params = new URLSearchParams(window.location.search)
    params.set('example', current.name)
    window.history.replaceState({}, '', `?${params.toString()}`)
    data.value = { ...(current.data ?? {}) }
  },
  { immediate: true },
)

const i18n = computed<JsonFormsI18nState>(() => ({
  locale: locale.value,
  translate: (key: string, defaultMessage?: string) =>
    get(get(example.value.i18n, locale.value, {}), key, defaultMessage ?? key),
}))

const onChange = (event: JsonFormsChangeEvent) => {
  data.value = event.data
}

/**
 * Le formulaire est monté avec `:key="example.name"` : changer d'exemple démonte tout.
 *
 * Différé d'un tick, car si un menu déroulant était ouvert, le même clic le referme.
 * Démonter dans la foulée laisse le `onClickOutside` de VueUse pointer sur une instance
 * détruite (`Cannot read properties of null (reading 'subTree')`).
 */
const selectExample = async (name: string) => {
  await nextTick()
  selected.value = name
}
</script>
