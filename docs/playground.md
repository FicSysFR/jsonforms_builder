---
layout: page
sidebar: false
aside: false
pageClass: playground-page
title: Playground
---

<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

/**
 * DEV (`yarn docs:dev`): iframe → playground Vite on :5174 (HMR).
 * PROD / `docs:preview`: iframe → static build under `/play/`.
 * Hash query (`#/?embed=1`) matches `createWebHashHistory` in the playground.
 */
const playSrc = computed(() => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5174/#/?embed=1'
  }
  return `${withBase('/play/index.html')}#/?embed=1`
})

const fullscreenHref = computed(() => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5174/'
  }
  return withBase('/play/index.html')
})
</script>

<div class="playground-shell">
  <div class="playground-toolbar">
    <div>
      <h1 class="playground-title">Playground</h1>
      <p class="playground-lead">
        Onglet <strong>Documentation</strong> = vitrines de contrôles Nuxt UI.
        Onglet <strong>Examples</strong> = démos JSONForms et cas limites.
      </p>
    </div>
    <a
      class="VPButton medium brand"
      :href="fullscreenHref"
      target="_blank"
      rel="noopener"
    >
      Plein écran
    </a>
  </div>

  <iframe
    class="playground-frame"
    :src="playSrc"
    title="JSONForms Builder playground"
    loading="eager"
    referrerpolicy="no-referrer"
    allow="clipboard-read; clipboard-write"
  />

  <p class="playground-foot">
    Catalogue détaillé :
    <a href="./guide/playground-examples">Exemples playground Nuxt UI</a>
  </p>
</div>
