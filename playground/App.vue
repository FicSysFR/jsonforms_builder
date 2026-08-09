<template lang="pug">
u-app
  //- In VitePress iframe (`?embed=1`), fill the frame instead of forcing 100vh.
  .bg-default.text-default(
    :class="isEmbedded ? 'flex h-full min-h-0 flex-col' : 'min-h-screen'"
  )
    //- `bg-default/75` goes in an attribute: Pug cannot parse `/` in the class
    //- shorthand and dumps the rest of the line as plain text.
    header.sticky.top-0.z-10.border-b.border-default(
      v-if="!isEmbedded || isBuilder"
      class="bg-default/75 backdrop-blur"
    )
      //- `flex-wrap` + `min-w-0`: in a narrow pane the toolbar wraps instead of
      //- pushing the page into horizontal overflow.
      .flex.flex-wrap.items-center.gap-2.px-4.py-3
        h1.min-w-0.truncate.text-sm.font-semibold.tracking-tight(
          :title="pageTitle"
        ) {{ pageTitle }}
        u-button(
          v-if="isBuilder"
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          size="sm"
          @click="leaveBuilder"
        )
        u-button(
          v-else
          label="Open builder"
          icon="i-lucide-pencil-ruler"
          color="neutral"
          variant="outline"
          size="sm"
          @click="openBuilder"
        )
        .flex-1
        u-select(
          v-if="!isBuilder"
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

    //- Compact bar when embedded in docs: keep locale + builder, drop duplicate title/theme.
    .flex.flex-wrap.items-center.gap-2.border-b.border-default.px-4.py-2(
      v-if="isEmbedded && !isBuilder"
    )
      u-button(
        label="Open builder"
        icon="i-lucide-pencil-ruler"
        color="neutral"
        variant="outline"
        size="sm"
        @click="openBuilder"
      )
      .flex-1
      u-select(
        v-model="locale"
        :items="localeItems"
        value-key="value"
        size="sm"
        class="w-28"
      )

    .min-h-0.flex-1.overflow-auto(v-if="isEmbedded")
      router-view(v-slot="{ Component }")
        component(:is="Component" v-bind="viewProps")
    router-view(v-else v-slot="{ Component }")
      component(:is="Component" v-bind="viewProps")
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { resolveReturnLocation } from './returnUrl'

const route = useRoute()
const router = useRouter()

const locale = ref<'fr' | 'en'>('fr')

/** True when shown inside the VitePress docs iframe (`?embed=1` or nested frame). */
const isEmbedded = computed(() => {
  if (route.query.embed === '1' || route.query.embed === 'true') {
    return true
  }
  return typeof window !== 'undefined' && window.parent !== window
})

const isBuilder = computed(() => route.name === 'builder')
const pageTitle = computed(() =>
  isBuilder.value ? 'JSONForms Builder' : 'JSONForms Builder — Playground',
)
const viewProps = computed(() => (isBuilder.value ? {} : { locale: locale.value }))

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

onMounted(() => {
  if (!isEmbedded.value) {
    return
  }
  document.documentElement.classList.add('playground-embed')
  document.documentElement.style.height = '100%'
  document.body.style.height = '100%'
  document.body.style.margin = '0'
  const app = document.getElementById('app')
  if (app) {
    app.style.height = '100%'
  }
})

/** Opens the builder and remembers the current gallery URL for the back button. */
const openBuilder = () => {
  void router.push({
    name: 'builder',
    query: {
      return: route.fullPath,
      ...(isEmbedded.value ? { embed: '1' } : {}),
    },
  })
}

/** Leaves the builder toward `?return=` when safe, otherwise the gallery root. */
const leaveBuilder = () => {
  void router.push(resolveReturnLocation(route.query.return))
}
</script>
