import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core'

/** Sidebar bucket in the playground: living docs vs demo / edge-case gallery. */
export type ExampleSection = 'docs' | 'examples'

export interface ExampleDescription {
  name: string
  label: string
  /**
   * `docs` — Nuxt UI showcases and option references (documentation).
   * `examples` — JSONForms demos, edge cases, and sample forms (default).
   */
  section?: ExampleSection
  data: unknown
  schema: JsonSchema
  uischema: UISchemaElement
  uischemas?: JsonFormsUISchemaRegistryEntry[]
  config?: Record<string, unknown>
  actions?: { label: string; apply: (props: StateProps) => unknown }[]
  i18n?: ExampleI18n
  readonly?: boolean
}

export interface StateProps {
  data: unknown
  schema?: JsonSchema
  uischema?: UISchemaElement
  renderers: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  config?: Record<string, unknown>
  uischemas?: JsonFormsUISchemaRegistryEntry[]
  readonly?: boolean
}

export interface ExampleI18n {
  [locale: string]: ExampleI18nKeyValue
}

export interface ExampleI18nKeyValue {
  [key: string]: ExampleI18nKeyValue | string
}
