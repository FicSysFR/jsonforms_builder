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

    router-view(v-slot="{ Component }")
      component(:is="Component" v-bind="viewProps")
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { resolveReturnLocation } from './returnUrl'

const route = useRoute()
const router = useRouter()

const locale = ref<'fr' | 'en'>('fr')

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

/** Opens the builder and remembers the current gallery URL for the back button. */
const openBuilder = () => {
  void router.push({
    name: 'builder',
    query: { return: route.fullPath },
  })
}

/** Leaves the builder toward `?return=` when safe, otherwise the gallery root. */
const leaveBuilder = () => {
  void router.push(resolveReturnLocation(route.query.return))
}
</script>
