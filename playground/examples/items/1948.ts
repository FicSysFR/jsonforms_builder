import { registerExamples } from '../register'
import type { UISchemaElement } from '@jsonforms/core'

export const schema = {
  type: 'object',
  definitions: {
    import: {
      title: 'Import',
      type: 'object',
      properties: {
        eClass: {
          const: 'http://my_schema/1.0.0#//Import',
        },
        document: {
          type: 'string',
        },
        package: {
          type: 'string',
        },
        prefix: {
          type: 'string',
        },
      },
    },
  },
  properties: {
    import: {
      type: 'array',
      items: {
        $ref: '#/definitions/import',
      },
    },
  },
}

export const uischema: UISchemaElement = undefined

export const data = {
  import: [
    {
      document: 'Document1',
      package: 'Package1',
      prefix: 'Prefix',
    },
  ],
}

registerExamples([
  {
    name: '1948_with',
    label: 'Issue 1948 - Array renderer selection (with schema)',
    data,
    schema,
    uischema,
  },
  {
    name: '1948_without',
    label: 'Issue 1948 - Array renderer selection (w/o schema)',
    data,
    schema: undefined,
    uischema,
  },
])
