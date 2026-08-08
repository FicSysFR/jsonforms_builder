// Example taken from the official JSONForms Vuetify renderers demo
// (eclipsesource/jsonforms-vuetify-renderers, MIT license), converted to our
// playground format. Absent from the main repo `packages/examples` corpus.
import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      items: {
        type: 'object',
        title: 'Users',
        properties: {
          firstname: {
            type: 'string',
          },
          lastname: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          age: {
            type: 'number',
            minimum: 0,
          },
        },
        required: ['firstname'],
      },
    },
  },
}

export const uischema = {
  type: 'ListWithDetail',
  scope: '#/properties/users',
  options: {
    detail: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstname',
              label: 'First Name',
            },
            {
              type: 'Control',
              scope: '#/properties/lastname',
              label: 'Last Name',
            },
          ],
        },
        {
          type: 'Control',
          scope: '#/properties/age',
          label: 'Age',
        },
        {
          type: 'Control',
          scope: '#/properties/email',
          label: 'Email',
        },
      ],
    },
    showSortButtons: true,
  },
}

export const data = {
  users: [
    {
      firstname: 'Max',
      lastname: 'Mustermann',
      age: 25,
      email: 'max@mustermann.com',
    },
    {
      firstname: 'John',
      lastname: 'Doe',
      age: 35,
      email: 'john@doe.com',
    },
  ],
}

registerExamples([
  {
    name: 'vuetify-list-with-details-and-reorder',
    label: 'List With Details And Reorder (Vuetify)',
    data,
    schema,
    uischema,
  },
])
