<template lang="pug">
u-app
  //- In VitePress embed (`provide` / `?embed=1`), fill the host instead of forcing 100vh.
  .bg-default.text-default.min-w-0.w-full(
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
        //- Dropped under `forcedEmbed`: VitePress already prints `siteTitle`
        //- ("JSONForms Builder") in its own navbar, right above this one. Kept
        //- everywhere else — a bare iframe or the standalone SPA has no chrome
        //- of its own to name the page.
        h1.min-w-0.truncate.text-sm.font-semibold.tracking-tight(
          v-if="!forcedEmbed"
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
        //- Hidden under `forcedEmbed`: VitePress owns `html.dark` there and we only
        //- mirror it, so the button would be a dead control. The builder route keeps
        //- this header even when embedded, which is how it used to show up.
        u-button(
          v-if="!forcedEmbed"
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          :aria-pressed="isDark"
          color="neutral"
          variant="ghost"
          aria-label="Toggle theme"
          @click="toggleDark()"
        )

    //- Compact bar when embedded in docs: keep locale + builder, drop duplicate title/theme.
    //- `lg:h-12` pins the height the gallery's `--pg-sticky-max` subtracts. It only
    //- needs to hold from `lg` up (where the sidebar turns sticky); below that the
    //- bar may wrap freely and `py-2` sizes it.
    .flex.flex-wrap.items-center.gap-2.border-b.border-default.px-4.py-2(
      v-if="isEmbedded && !isBuilder"
      class="lg:h-12 lg:py-0"
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

    //- This div — not the document — is the scroll container in the docs, and it
    //- already starts below every bit of chrome. Retarget the gallery's sticky
    //- sidebar at it: offset 0, and a height budget of the viewport minus the
    //- VitePress fixed nav, the compact bar above (`lg:h-12`) and the gallery's
    //- own `p-4` top padding.
    .min-h-0.flex-1.overflow-auto(
      v-if="isEmbedded"
      class="[--pg-sticky-top:0px] [--pg-sticky-max:calc(100dvh-var(--vp-nav-height,4rem)-4rem)]"
    )
      router-view(v-slot="{ Component }")
        component(:is="Component" v-bind="viewProps")
    router-view(v-else v-slot="{ Component }")
      component(:is="Component" v-bind="viewProps")
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { playgroundEmbedKey } from './embed'
import { resolveReturnLocation } from './returnUrl'

const route = useRoute()
const router = useRouter()

const locale = ref<'fr' | 'en'>('fr')

const forcedEmbed = inject(playgroundEmbedKey, false)

/** True when hosted inside VitePress / iframe (`provide` or `?embed=1`). */
const isEmbedded = computed(() => {
  if (forcedEmbed) {
    return true
  }
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

/**
 * Standalone: VueUse owns `html.dark`.
 * Embedded in VitePress: follow the docs theme (same `html.dark` class) — do not
 * keep a second preference under `vueuse-color-scheme` (that caused the shade /
 * light-dark mismatch with the VitePress nav).
 */
const isDark = forcedEmbed
  ? ref(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  : useDark()

const toggleDark = forcedEmbed ? () => undefined : useToggle(isDark)

/** Mirror VitePress appearance → Nuxt UI tokens (`html.dark`). */
const syncEmbedThemeFromVitePress = () => {
  if (typeof document === 'undefined') {
    return
  }
  isDark.value = document.documentElement.classList.contains('dark')
}

let embedThemeObserver: MutationObserver | undefined

onMounted(() => {
  if (forcedEmbed) {
    syncEmbedThemeFromVitePress()
    embedThemeObserver = new MutationObserver(syncEmbedThemeFromVitePress)
    embedThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return
  }

  // Full-document sizing only when alone in an iframe; VitePress already sizes the host.
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

onBeforeUnmount(() => {
  embedThemeObserver?.disconnect()
  embedThemeObserver = undefined
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
