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

## Documentation Nuxt UI

Dans l’onglet **Documentation**, chaque vitrine affiche le formulaire live + un onglet **API** (Name / Type / Default / Description). Les noms techniques commencent par `nuxt-`.

| Vitrine | Contrôles Nuxt UI | Guide options |
|---|---|---|
| [Vitrine des contrôles](/play/index.html?section=docs&example=nuxt-ui-showcase) | Vue d’ensemble (select, pin, color, tags, rating, date, file…) | [Renderers](/guide/renderers) |
| [String & Textarea](/play/index.html?section=docs&example=nuxt-string) | `UInput`, `UTextarea`, password | [Texte](/guide/options/string) |
| [Number & Slider](/play/index.html?section=docs&example=nuxt-number) | `UInputNumber`, `USlider` | [Nombres](/guide/options/number) |
| [Boolean](/play/index.html?section=docs&example=nuxt-boolean) | `UCheckbox`, `USwitch` | [Booléen](/guide/options/boolean) |
| [Select](/play/index.html?section=docs&example=nuxt-select) | `USelect`, `USelectMenu` | [Enum](/guide/options/enum) |
| [Radio & Multi-enum](/play/index.html?section=docs&example=nuxt-radio) | `URadioGroup`, `UCheckboxGroup` | [Enum](/guide/options/enum) |
| [Autocomplete API](/play/index.html?section=docs&example=nuxt-autocomplete) | `UInputMenu` + `options.api` | [Autocomplete](/guide/options/string#autocomplete-api--uinputmenu) |
| [Pin Input](/play/index.html?section=docs&example=nuxt-pin-input) | `UPinInput` | [Pin](/guide/options/string#pin--upininput) |
| [Color Picker](/play/index.html?section=docs&example=nuxt-color) | `UColorPicker` | [Color](/guide/options/string#color--ucolorpicker) |
| [File Upload](/play/index.html?section=docs&example=nuxt-file-upload) | `UFileUpload` | [File](/guide/options/string#file-upload--ufileupload) |
| [Tags](/play/index.html?section=docs&example=nuxt-tags) | `UInputTags` | [Tags](/guide/options/array#tags--uinputtags) |
| [Rating](/play/index.html?section=docs&example=nuxt-rating) | `UInputRating` | [Rating](/guide/options/number#rating--uinputrating) |
| [Date & Time](/play/index.html?section=docs&example=nuxt-dates) | `UInputDate`, `UInputTime` | [Dates](/guide/options/date) |
| [Calendar](/play/index.html?section=docs&example=nuxt-calendar) | `UCalendar` | [Calendar](/guide/options/date#calendar--ucalendar-déplié) |
| [Date ranges](/play/index.html?section=docs&example=nuxt-date-ranges) | Plages & contraintes | [Dates](/guide/options/date) |
| [Array](/play/index.html?section=docs&example=nuxt-array) | Cartes répétables | [Array](/guide/options/array#array--cartes-répétables) |
| [WYSIWYG](/play/index.html?section=docs&example=nuxt-wysiwyg) | `UEditor` (`allRenderers`) | [WYSIWYG](/guide/options/string#wysiwyg--ueditor) |
| [Layouts](/play/index.html?section=docs&example=nuxt-layouts) | `UCard`, `UTabs`, Label | [Layouts](/guide/options/layouts) |
| [Control Options](/play/index.html?section=docs&example=control-options) | Options communes + mix | [Communes](/guide/options/common) |

→ Catalogue détaillé : [Exemples playground Nuxt UI](/guide/playground-examples).
