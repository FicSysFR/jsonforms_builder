---
layout: page
sidebar: false
aside: false
pageClass: playground-page
title: Playground
---

<script setup>
import { withBase } from 'vitepress'
</script>

<div class="px-4 py-4 space-y-3">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight m-0">Playground</h1>
      <p class="text-sm opacity-70 m-0 mt-1">
        Onglet <strong>Documentation</strong> = vitrines de contrôles Nuxt UI.
        Onglet <strong>Examples</strong> = démos JSONForms et cas limites.
      </p>
    </div>
    <a
      class="VPButton medium brand"
      :href="withBase('/play/index.html')"
      target="_blank"
      rel="noopener"
    >
      Plein écran
    </a>
  </div>

  <iframe
    class="playground-frame"
    :src="withBase('/play/index.html')"
    title="JSONForms Builder playground"
    loading="lazy"
    referrerpolicy="no-referrer"
  />
</div>
