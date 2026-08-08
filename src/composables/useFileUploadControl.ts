import { computed, ref, watch } from 'vue'
import type { JsonSchema } from '@jsonforms/core'
import { useUiControl } from '../utils'

type UiControlInput = Parameters<typeof useUiControl>[0]

type UseFileUploadControlOptions = {
  jsonFormsControl: UiControlInput
  clearValue: unknown
}

export type ParsedDataUrl = {
  mime: string
  /** Nom du fichier, conservé dans le paramètre non standard `;name=`. */
  name?: string
  payload: string
  isBase64: boolean
}

const FALLBACK_MIME = 'application/octet-stream'
const FALLBACK_NAME = 'fichier'

/**
 * Découpe une URL de données `data:<mime>[;name=…][;base64],<charge utile>`.
 *
 * Le paramètre `name` ne fait pas partie de la RFC 2397 mais y est toléré : c'est le seul
 * endroit où loger le nom d'origine du fichier, qu'un schéma `type: "string"` n'a par
 * ailleurs aucun moyen de porter.
 */
export const parseDataUrl = (value: unknown): ParsedDataUrl | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const match = value.match(/^data:([^;,]*)((?:;[^;,]*)*),([\s\S]*)$/)
  if (!match) {
    return undefined
  }

  const [, mime, rawParams, payload] = match
  const params = rawParams.split(';').filter(Boolean)
  const rawName = params.find((param) => param.startsWith('name='))?.slice('name='.length)

  let name: string | undefined
  if (rawName) {
    try {
      name = decodeURIComponent(rawName)
    } catch {
      // Un `%` isolé dans le nom suffit à faire lever `decodeURIComponent` : mieux vaut
      // afficher le nom tel quel qu'échouer à ouvrir le fichier.
      name = rawName
    }
  }

  return {
    mime: mime || FALLBACK_MIME,
    name,
    payload,
    isBase64: params.includes('base64'),
  }
}

export const buildDataUrl = ({
  mime,
  name,
  payload,
}: {
  mime?: string
  name?: string
  payload: string
}): string => {
  const namePart = name ? `;name=${encodeURIComponent(name)}` : ''

  return `data:${mime || FALLBACK_MIME}${namePart};base64,${payload}`
}

/** Filtre du sélecteur de fichiers : `options.accept` prime, sinon `contentMediaType`. */
export const resolveAccept = (
  optionAccept: unknown,
  schema: (JsonSchema & { contentMediaType?: string }) | undefined,
): string => {
  if (typeof optionAccept === 'string' && optionAccept.trim()) {
    return optionAccept.trim()
  }

  const items = schema?.items
  const itemMediaType =
    items && !Array.isArray(items)
      ? (items as { contentMediaType?: string }).contentMediaType
      : undefined

  return schema?.contentMediaType ?? itemMediaType ?? '*'
}

/** Un schéma `array` accepte plusieurs fichiers ; une `string` un seul. */
export const isMultipleFileSchema = (schema: JsonSchema | undefined): boolean => {
  return schema?.type === 'array'
}

/** Taille lisible, pour la ligne d'aide sous le dépôt. */
export const formatFileSize = (bytes: unknown): string => {
  const size = Number(bytes)
  if (!Number.isFinite(size) || size < 0) {
    return ''
  }

  const units = ['o', 'ko', 'Mo', 'Go']
  let value = size
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

/** Reconstruit un `File` à partir d'une URL de données, pour réafficher un formulaire chargé. */
export const dataUrlToFile = (value: unknown): File | undefined => {
  const parsed = parseDataUrl(value)
  if (!parsed || !parsed.isBase64) {
    return undefined
  }

  try {
    const binary = atob(parsed.payload)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return new File([bytes], parsed.name ?? FALLBACK_NAME, { type: parsed.mime })
  } catch {
    return undefined
  }
}

/** Chemin aller : le `File` du composant vers l'URL de données stockée dans le modèle. */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const parsed = parseDataUrl(result)

      // `FileReader` n'écrit jamais le nom : on le réinjecte pour ne pas le perdre.
      resolve(
        parsed
          ? buildDataUrl({ mime: parsed.mime, name: file.name, payload: parsed.payload })
          : result,
      )
    }

    reader.readAsDataURL(file)
  })
}

export const useFileUploadControl = ({
  jsonFormsControl,
  clearValue,
}: UseFileUploadControlOptions) => {
  const adaptTarget = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.length ? value : clearValue
    }

    return value ?? clearValue
  }

  const control = useUiControl(jsonFormsControl, adaptTarget)

  const multiple = computed(() => isMultipleFileSchema(control.control.value.schema))

  const accept = computed(() =>
    resolveAccept(control.appliedOptions.value?.accept, control.control.value.schema),
  )

  const files = ref<File[]>([])

  /**
   * Dernière valeur émise par ce contrôle. Le `watch` ci-dessous doit distinguer une
   * modification venue de l'extérieur (chargement d'un brouillon, règle JSONForms) de
   * l'écho de notre propre `onChange` — sans quoi chaque dépôt de fichier reconstruirait
   * un `File` neuf, et le composant repartirait dans un cycle de rendu.
   */
  const lastEmitted = ref<string>('')

  const toDataUrls = (data: unknown): string[] => {
    if (Array.isArray(data)) {
      return data.filter((entry): entry is string => typeof entry === 'string')
    }

    return typeof data === 'string' && data ? [data] : []
  }

  watch(
    () => control.control.value.data,
    (data) => {
      const serialized = JSON.stringify(data ?? null)
      if (serialized === lastEmitted.value) {
        return
      }

      lastEmitted.value = serialized
      files.value = toDataUrls(data)
        .map(dataUrlToFile)
        .filter((file): file is File => file !== undefined)
    },
    { immediate: true },
  )

  const onFilesChange = async (value: File | File[] | null | undefined) => {
    const list = value ? (Array.isArray(value) ? value : [value]) : []
    files.value = list

    const urls = await Promise.all(list.map(fileToDataUrl))
    const next = multiple.value ? urls : urls[0]

    lastEmitted.value = JSON.stringify(adaptTarget(next) ?? null)
    control.onChange(next)
  }

  const modelValue = computed(() => (multiple.value ? files.value : (files.value[0] ?? null)))

  /** Récapitulatif « 2 fichiers · 1,4 Mo », affiché sous la zone de dépôt. */
  const summary = computed(() => {
    if (!files.value.length) {
      return ''
    }

    const total = files.value.reduce((sum, file) => sum + file.size, 0)
    const count = files.value.length

    return `${count} fichier${count > 1 ? 's' : ''} · ${formatFileSize(total)}`
  })

  return {
    ...control,
    adaptTarget,
    multiple,
    accept,
    files,
    modelValue,
    summary,
    onFilesChange,
  }
}
