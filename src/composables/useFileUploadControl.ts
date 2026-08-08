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
  /** File name, kept in the non-standard `;name=` parameter. */
  name?: string
  payload: string
  isBase64: boolean
}

const FALLBACK_MIME = 'application/octet-stream'
const FALLBACK_NAME = 'fichier'

/**
 * Parses a data URL `data:<mime>[;name=…][;base64],<payload>`.
 *
 * The `name` parameter is not part of RFC 2397 but is tolerated there: it is the only
 * place to store the original file name, which a `type: "string"` schema otherwise
 * has no way to carry.
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
      // A lone `%` in the name is enough for `decodeURIComponent` to throw: better to
      // show the name as-is than fail to open the file.
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

/** File picker filter: `options.accept` wins, otherwise `contentMediaType`. */
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

/** An `array` schema accepts multiple files; a `string` accepts one. */
export const isMultipleFileSchema = (schema: JsonSchema | undefined): boolean => {
  return schema?.type === 'array'
}

/** Human-readable size, for the help line under the drop zone. */
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

/** Rebuilds a `File` from a data URL, to redisplay a loaded form. */
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

/** Outbound path: the component's `File` to the data URL stored in the model. */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const parsed = parseDataUrl(result)

      // `FileReader` never writes the name: we reinject it so it is not lost.
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
   * Last value emitted by this control. The `watch` below must distinguish an
   * external change (draft load, JSONForms rule) from the echo of our own
   * `onChange` — otherwise each file drop would rebuild a fresh `File` and the
   * component would enter a render loop.
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

  /** Summary like « 2 fichiers · 1,4 Mo », shown under the drop zone. */
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
