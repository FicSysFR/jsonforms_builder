import { computed } from 'vue'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseTagsControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
  debounceWait?: number
}

/**
 * `UInputTags` émet un tableau de chaînes. On écarte les entrées vides (une virgule
 * isolée, un espace validé par `addOnBlur`) et on retombe sur `clearValue` quand il ne
 * reste rien — laisser un `[]` dans le modèle ferait échouer un `minItems: 1` avec un
 * message qui ne correspond à rien de visible à l'écran.
 */
export const createTagsAdaptTarget = (clearValue: unknown) => {
  return (value: unknown): unknown => {
    if (!Array.isArray(value)) {
      return clearValue
    }

    const tags = value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag ?? '').trim()))
      .filter((tag) => tag.length > 0)

    return tags.length ? tags : clearValue
  }
}

/** Normalise la donnée stockée vers le tableau attendu par le composant. */
export const toTagsModel = (data: unknown): string[] => {
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((tag) => (typeof tag === 'string' ? tag : String(tag ?? '')))
}

/**
 * `duplicate` de `UInputTags` autorise les doublons ; `uniqueItems` du schéma les interdit.
 * Les deux disent la même chose en sens inverse.
 */
export const allowsDuplicateTags = (uniqueItems: boolean | undefined): boolean => {
  return uniqueItems !== true
}

/** Séparateurs de saisie : `options.delimiter`, sinon la virgule. */
export const resolveTagsDelimiter = (delimiter: unknown): string => {
  return typeof delimiter === 'string' ? delimiter : ','
}

export const useTagsControl = ({
  jsonFormsControl,
  clearValue,
  debounceWait,
}: UseTagsControlOptions) => {
  const adaptTarget = createTagsAdaptTarget(clearValue)
  const control = useUiControl(jsonFormsControl, adaptTarget, debounceWait)

  const modelValue = computed(() => toTagsModel(control.control.value.data))

  const max = computed(() => control.control.value.schema?.maxItems)

  const duplicate = computed(() => allowsDuplicateTags(control.control.value.schema?.uniqueItems))

  const delimiter = computed(() => resolveTagsDelimiter(control.appliedOptions.value?.delimiter))

  /** Longueur maximale d'une étiquette, tirée du schéma des éléments. */
  const maxLength = computed(() => {
    const items = control.control.value.schema?.items

    return items && !Array.isArray(items) ? items.maxLength : undefined
  })

  return {
    ...control,
    adaptTarget,
    modelValue,
    max,
    duplicate,
    delimiter,
    maxLength,
  }
}
