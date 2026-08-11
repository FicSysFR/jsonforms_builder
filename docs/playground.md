---
layout: page
sidebar: false
aside: false
pageClass: playground-page
title: Playground
---

<script setup>
/**
 * Playground is mounted in-process (Nuxt UI + Vue Router hash) — same bundle as
 * the docs site. Wrapped in `vp-raw` so VitePress doc styles do not restyle it.
 */
</script>

<div class="playground-shell vp-raw">
  <ClientOnly>
    <PlaygroundEmbed />
    <template #fallback>
      <p class="playground-loading">Chargement du playground…</p>
    </template>
  </ClientOnly>
</div>
