<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type App } from 'vue'
import { createPlaygroundApp } from '@playground/createApp'

/**
 * Mounts the playground as a nested Vue app inside VitePress.
 * This file is only loaded on the client via `defineClientComponent` in the theme,
 * so a static import is safe and avoids broken `@fs/…` dynamic URLs under `base`.
 */
const host = ref<HTMLElement | null>(null)
let app: App | undefined

onMounted(() => {
  if (!host.value) {
    return
  }
  app = createPlaygroundApp({ embed: true })
  app.mount(host.value)
})

onBeforeUnmount(() => {
  app?.unmount()
  app = undefined
})
</script>

<template>
  <div ref="host" class="playground-embed-host" />
</template>
