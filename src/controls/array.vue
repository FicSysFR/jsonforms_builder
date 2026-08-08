<template lang="pug">
  .array-list(v-if="control.visible" :id="controlWrapper.id" :class="styles.arrayList.root")
    .flex.items-center.justify-between.gap-2(:class="styles.arrayList.legend")
      h4(:class="styles.arrayList.label" v-text="computedLabel")
      u-button(
        :disabled="!canAdd"
        :class="styles.arrayList.addButton"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        size="sm"
        label="Ajouter"
        @click="addItem"
      )

    p.text-sm(v-if="!items.length" :class="styles.arrayList.noData") Aucun élément.

    //- Valeurs simples : une ligne par entrée, sans carte ni titre. Le libellé et la
    //- description de l'élément sont identiques d'une ligne à l'autre — les répéter
    //- rendrait la liste illisible dès quelques entrées.
    .space-y-1(v-else-if="isPrimitiveItems" :class="styles.arrayList.itemWrapper")
      .flex.items-start.gap-1(
        v-for="(item, index) in items"
        :key="`${control.path}-${index}`"
        :class="styles.arrayList.item"
      )
        .min-w-0.flex-1
          dispatch-renderer(
            :schema="control.schema"
            :uischema="childUiSchema"
            :path="childPath(index)"
            :enabled="control.enabled"
            :renderers="control.renderers"
            :cells="control.cells"
          )
        u-button(
          v-if="showSortButtons"
          :disabled="index === 0 || !control.enabled"
          :class="styles.arrayList.itemMoveUp"
          icon="i-lucide-chevron-up"
          aria-label="Monter l'élément"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="moveUp(index)"
        )
        u-button(
          v-if="showSortButtons"
          :disabled="index === items.length - 1 || !control.enabled"
          :class="styles.arrayList.itemMoveDown"
          icon="i-lucide-chevron-down"
          aria-label="Descendre l'élément"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="moveDown(index)"
        )
        u-button(
          :disabled="!canRemove"
          :class="styles.arrayList.itemDelete"
          icon="i-lucide-trash-2"
          aria-label="Supprimer l'élément"
          color="error"
          variant="ghost"
          size="sm"
          @click="askRemove(index)"
        )

    //- Objets : une carte titrée, où le repère visuel vaut le coût vertical.
    .space-y-2(v-else :class="styles.arrayList.itemWrapper")
      u-card(
        v-for="(item, index) in items"
        :key="`${control.path}-${index}`"
        :class="styles.arrayList.item"
        :ui="{ header: 'p-3 sm:px-4', body: 'p-3 sm:p-4' }"
      )
        template(#header)
          .flex.items-center.justify-between.gap-2(:class="styles.arrayList.itemToolbar")
            span.text-sm.font-medium(:class="styles.arrayList.itemLabel" v-text="itemLabel(index)")
            .flex.items-center.gap-1
              u-button(
                v-if="showSortButtons"
                :disabled="index === 0 || !control.enabled"
                :class="styles.arrayList.itemMoveUp"
                icon="i-lucide-chevron-up"
                aria-label="Monter l'élément"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="moveUp(index)"
              )
              u-button(
                v-if="showSortButtons"
                :disabled="index === items.length - 1 || !control.enabled"
                :class="styles.arrayList.itemMoveDown"
                icon="i-lucide-chevron-down"
                aria-label="Descendre l'élément"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="moveDown(index)"
              )
              u-button(
                :disabled="!canRemove"
                :class="styles.arrayList.itemDelete"
                icon="i-lucide-trash-2"
                aria-label="Supprimer l'élément"
                color="error"
                variant="ghost"
                size="xs"
                @click="askRemove(index)"
              )

        .space-y-4(:class="styles.arrayList.itemContent")
          dispatch-renderer(
            :schema="control.schema"
            :uischema="childUiSchema"
            :path="childPath(index)"
            :enabled="control.enabled"
            :renderers="control.renderers"
            :cells="control.cells"
          )

    //- Une seule description, sous la liste. Portée par le tableau et non par chaque
    //- ligne : le schéma d'élément étant commun, la répéter n'apprendrait rien.
    p.text-xs.text-muted(v-if="control.description" v-text="control.description")

    p.text-sm.text-error(v-if="control.errors" v-text="control.errors")

    confirm-dialog(
      :open="pendingRemoveIndex !== null"
      :title="`Supprimer ${pendingRemoveLabel} ?`"
      description="Cette entrée sera retirée de la liste. L'action est irréversible."
      @update:open="cancelRemove"
      @confirm="confirmRemove"
    )
</template>

<script lang="ts">
import { ControlElement, JsonFormsRendererRegistryEntry, isObjectArrayControl, isPrimitiveArrayControl } from '@jsonforms/core'
import { computed, defineComponent, nextTick, ref } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsArrayControl, RendererProps } from '@jsonforms/vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import { ConfirmDialog } from '../common'
import { isCombinatorItemsArray, useArrayControl } from '../composables'

/**
 * ArrayControlRenderer
 *
 * Rend les propriétés `type: "array"` : une carte par élément, avec réordonnancement
 * et suppression, plus un bouton d'ajout respectant `minItems` / `maxItems`.
 *
 * Absent de la v1 — un tableau y affichait « No applicable renderer found », ce qui
 * rendait impossible toute saisie répétée (lignes de personnel, de matériel…).
 *
 * `options.elementLabelProp` choisit la propriété servant de titre à chaque carte.
 */
const controlRenderer = defineComponent({
  name: 'ArrayControlRenderer',
  components: {
    ConfirmDialog,
    DispatchRenderer,
    UButton,
    UCard,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useArrayControl({
      jsonFormsControl: useJsonFormsArrayControl(props),
    })

    /** Index en attente de confirmation ; `null` quand aucune modale n'est ouverte. */
    const pendingRemoveIndex = ref<number | null>(null)

    const pendingRemoveLabel = computed(() =>
      pendingRemoveIndex.value === null
        ? ''
        : `« ${control.itemLabel(pendingRemoveIndex.value)} »`,
    )

    const askRemove = (index: number) => {
      pendingRemoveIndex.value = index
    }

    const cancelRemove = () => {
      pendingRemoveIndex.value = null
    }

    const confirmRemove = async () => {
      const index = pendingRemoveIndex.value
      pendingRemoveIndex.value = null

      if (index === null) {
        return
      }

      // Un tick avant de retirer la ligne : la modale se démonte au même instant, et
      // supprimer dans la foulée rejouerait le défaut `onClickOutside` de VueUse
      // (cf. la note du README sur `subTree`).
      await nextTick()
      control.removeItem(index)
    }

    return {
      ...control,
      pendingRemoveIndex,
      pendingRemoveLabel,
      askRemove,
      cancelRemove,
      confirmRemove,
    }
  },
})

export default controlRenderer

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  /**
   * Deux rangs distincts, et non un `rankWith(2, or(...))` : `enum-and-suggestion`
   * revendique déjà les tableaux de primitives au rang 2 (multi-sélection). On ne
   * dispute donc que les tableaux d'objets à ce rang, et on se contente du rang 1
   * pour les primitives — ce qui reste au-dessus du défaut sans lui passer devant.
   */
  tester: (uischema, schema, context) => {
    if (isObjectArrayControl(uischema, schema, context)) {
      return 2
    }

    // Tableau dont les éléments sont un combinateur (`items: { oneOf: [...] }`) : ni
    // objet ni primitive au sens de JSONForms, donc ignoré par les deux testers
    // ci-dessus. C'est pourtant bien une liste, chaque entrée étant ensuite confiée au
    // renderer de combinateur.
    if (isCombinatorItemsArray(uischema, schema, context)) {
      return 2
    }

    return isPrimitiveArrayControl(uischema, schema, context) ? 1 : -1
  },
}
</script>
