// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  definitions: {
    address: {
      type: 'object',
      title: 'Address',
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
      title: 'User',
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
  type: 'object',
  properties: {
    label: {
      type: 'string',
    },
  },
  allOf: [
    {
      $ref: '#/definitions/address',
    },
    {
      $ref: '#/definitions/user',
    },
  ],
}

export const uischema = undefined

export const data = {
  addressOrUser: {
    street_address: '1600 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
  },
}

registerExamples([
  {
    name: 'vuetify-allOf-with-props',
    label: 'AllOf With Props (Vuetify)',
    data,
    schema,
    uischema,
  },
])
