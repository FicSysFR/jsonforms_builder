<template lang="pug">
.space-y-6
  section(v-for="group in groups" :key="group.title")
    h3.text-sm.font-semibold.tracking-tight.mb-2 {{ group.title }}
    .overflow-x-auto.rounded-lg.border.border-default
      table.w-full.text-sm
        thead.bg-elevated.text-left
          tr
            th.px-3.py-2.font-medium.whitespace-nowrap Name
            th.px-3.py-2.font-medium.whitespace-nowrap Type
            th.px-3.py-2.font-medium.whitespace-nowrap Default
            th.px-3.py-2.font-medium Description
        tbody
          tr.border-t.border-default(
            v-for="prop in group.props"
            :key="prop.name"
          )
            td.px-3.py-2.align-top.whitespace-nowrap
              code.text-xs.text-primary {{ prop.name }}
            td.px-3.py-2.align-top.whitespace-nowrap
              code.text-xs.text-muted {{ prop.type }}
            td.px-3.py-2.align-top.whitespace-nowrap.text-muted
              code.text-xs(v-if="prop.default") {{ prop.default }}
              span(v-else) —
            td.px-3.py-2.align-top.text-muted.leading-snug {{ prop.description }}
  p.text-xs.text-muted(v-if="groups.length === 0")
    | Pas de fiche API pour cet exemple.
</template>

<script setup lang="ts">
import type { ApiPropGroup } from './props'

defineProps<{
  groups: ApiPropGroup[]
}>()
</script>
