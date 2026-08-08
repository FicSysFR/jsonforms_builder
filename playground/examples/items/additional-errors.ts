import type { ErrorObject } from 'ajv'
import type { StateProps } from '../example'
import { registerExamples } from '../register'
import { schema, uischema, data } from './person'

export const additionalErrors: ErrorObject[] = []

export const actions = [
  {
    label: 'Add additional error',
    apply: (props: StateProps) => {
      additionalErrors.push({
        instancePath: '/personalData/age',
        message: `New error #${additionalErrors.length + 1}`,
        schemaPath: '',
        keyword: '',
        params: {},
      })
      return {
        ...props,
        additionalErrors: [...additionalErrors],
      }
    },
  },
]

registerExamples([
  {
    name: 'additional-errors',
    label: 'Additional errors',
    data,
    schema,
    uischema,
    actions,
  },
])
