<template lang="pug">
  //- La description est passée en permanence, sans dépendre du focus.
  //-
  //- `UFormField` monte sa ligne du bas en `v-if` : la révéler au focus la fait surgir
  //- dans le flux et pousse d'une ligne tout ce qui suit — c'est le clignotement observé
  //- en parcourant un formulaire. La rendre en permanence réserve la place une fois pour
  //- toutes, et rend au passage l'aide lisible sans avoir à cliquer dans le champ.
  //-
  //- Cela prend le pas sur le défaut de JSONForms (`showUnfocusedDescription: false`),
  //- délibérément : ce défaut est précisément ce qui provoquait le décalage.
  u-form-field(
    v-if="visible"
    v-bind="uiProps ? uiProps('formField') : {}"
    :id="id"
    :name="id"
    :label="fieldLabel"
    :help="description || undefined"
    :error="errors || undefined"
    :required="showAsterisk"
    :class="styles.control.root"
    :ui="fieldUi"
  )
    //- Libellé fantôme (hauteur de ligne uniquement). Le vrai libellé reste sur la case :
    //- `aria-hidden` évite la double annonce aux lecteurs d'écran.
    template(v-if="reserveLabelSpace" #label)
      span(aria-hidden="true") &nbsp;

    //- Envelopper uniquement le contrôle : `flex` sur le conteneur `UFormField`
    //- (qui contient aussi `help`) alignait la description à droite de la case.
    div(v-if="reserveLabelSpace" class="min-h-8 flex items-center w-full")
      slot(name="default")
    template(v-else)
      slot(name="default")
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import type { Theme } from '../theme'

/**
 * ControlWrapper
 *
 * Enveloppe commune à tous les contrôles, bâtie sur `UFormField`.
 *
 * En v1 chaque contrôle portait lui-même son label, son hint et son message d'erreur
 * *en plus* du wrapper — d'où une duplication systématique. Ici `UFormField` est seul
 * responsable du libellé, de l'astérisque de champ requis, du texte d'aide et de
 * l'erreur ; le contrôle ne rend plus que sa saisie dans le slot par défaut.
 *
 * @example
 * <control-wrapper v-bind="controlWrapper" :styles="styles">
 *   <u-input v-model="value" />
 * </control-wrapper>
 */
export default defineComponent({
  name: 'ControlWrapperCommonComponent',
  components: {
    UFormField,
  },
  props: {
    /** Identifiant unique du champ, aussi utilisé comme `name` pour le rattachement `UForm`. */
    id: {
      required: true,
      type: String,
    },

    /** Texte d'aide affiché sous le champ. */
    description: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Message d'erreur de validation. */
    errors: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Libellé du champ. */
    label: {
      required: false as const,
      type: String,
      default: undefined,
    },

    /** Affiche ou masque l'ensemble du champ. */
    visible: {
      required: false as const,
      type: Boolean,
      default: true,
    },

    /** Champ obligatoire au sens du JSON Schema. */
    required: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /**
     * Affiche la description. Piloté par `showDescription()` du contrôle, qui masque
     * l'aide au repos sauf si `showUnfocusedDescription` est activé.
     */
    showDescription: {
      required: false as const,
      type: Boolean,
      default: true,
    },

    /**
     * Réserve une ligne de libellé vide lorsque le contrôle porte son libellé lui-même.
     *
     * Aligne les cases à cocher sur les champs voisins d'une disposition horizontale,
     * au lieu de les laisser flotter à hauteur de leurs libellés.
     */
    reserveLabelSpace: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /** Masque l'astérisque des champs requis (option `hideRequiredAsterisk`). */
    hideRequiredAsterisk: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    /** Thème résolu pour cet élément. */
    styles: {
      required: true,
      type: Object as PropType<Theme>,
    },

    /** Accès aux props libres du uischema (`options.formField`). */
    uiProps: {
      required: false as const,
      type: Function as PropType<(path: string) => Record<string, any>>,
      default: undefined,
    },
  },
  computed: {
    /**
     * `UFormField` rend lui-même l'astérisque : on ne passe donc PAS par `computeLabel`
     * de JSONForms, qui l'aurait concaténé au libellé et produit un doublon.
     *
     * Avec `reserveLabelSpace`, le libellé visible est sur la case : l'astérisque sur la
     * ligne fantôme flotterait tout seul — on le coupe ici.
     */
    showAsterisk(): boolean {
      if (this.reserveLabelSpace) {
        return false
      }

      return this.required && !this.hideRequiredAsterisk
    },

    /**
     * Libellé passé à `UFormField`.
     *
     * Si `reserveLabelSpace` : un espace insécable force la ligne de libellé (même hauteur
     * que les voisins). Un `label` vide / `undefined` ne suffit pas — `UFormField` ne
     * monte son wrapper de libellé que si `label` est truthy, et `:label="undefined"` ne
     * remplace pas un `v-bind` amont (mergeProps ignore `undefined`).
     */
    fieldLabel(): string | undefined {
      if (this.reserveLabelSpace) {
        return '\u00A0'
      }

      return this.label
    },

    /**
     * Laisse passer les surcharges `ui` du uischema.
     *
     * La hauteur / centrage pour `reserveLabelSpace` est sur l'enveloppe du slot
     * (voir le gabarit), pas sur `container` : celui-ci inclut aussi `help`.
     *
     * @see help — la description est rendue en permanence, cf. le commentaire du gabarit.
     */
    fieldUi(): Record<string, string> {
      return this.uiProps?.('formField')?.ui ?? {}
    },
  },
})
</script>
