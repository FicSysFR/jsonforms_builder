// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    foo: {
      anyOf: [
        {
          type: 'string',
        },
        {
          enum: ['foo', 'bar'],
        },
      ],
    },
  },
}

export const uischema = undefined

export const data = {
  foo: 'foo',
}

registerExamples([
  {
    name: 'vuetify-anyOf-simple',
    label: 'AnyOf Simple (Vuetify)',
    data,
    schema,
    uischema,
  },
])
