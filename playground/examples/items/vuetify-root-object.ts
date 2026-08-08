// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    address: {
      type: 'object',
      properties: {
        street_address: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        state: {
          type: 'string',
        },
      },
      required: ['street_address', 'city', 'state'],
    },
    user: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        mail: {
          type: 'string',
        },
      },
      required: ['name', 'mail'],
    },
  },
}

export const uischema = {
  type: 'Control',
  scope: '#',
}

export const data = {
  address: {
    street_address: '1600 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
  },
}

registerExamples([
  {
    name: 'vuetify-root-object',
    label: 'Root Object (Vuetify)',
    data,
    schema,
    uischema,
  },
])
