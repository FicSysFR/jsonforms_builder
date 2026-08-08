import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core'

export interface ExampleDescription {
  name: string
  label: string
  data: any
  schema: JsonSchema
  uischema: UISchemaElement
  uischemas?: JsonFormsUISchemaRegistryEntry[]
  config?: any
  actions?: { label: string; apply: (props: StateProps) => any }[]
  i18n?: ExampleI18n
  readonly?: boolean
}

export interface StateProps {
  data: any
  schema?: JsonSchema
  uischema?: UISchemaElement
  renderers: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  config?: any
  uischemas?: JsonFormsUISchemaRegistryEntry[]
  readonly?: boolean
}

export interface ExampleI18n {
  [locale: string]: ExampleI18nKeyValue
}

export interface ExampleI18nKeyValue {
  [key: string]: ExampleI18nKeyValue | string
}
