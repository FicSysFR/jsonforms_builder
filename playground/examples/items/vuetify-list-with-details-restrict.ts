// Exemple repris du démo officiel des renderers Vuetify de JSONForms
// (eclipsesource/jsonforms-vuetify-renderers, licence MIT), converti au format
// de notre playground. Absent du corpus `packages/examples` du dépôt principal.
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
      minItems: 1,
      maxItems: 5,
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
    restrict: true,
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
    name: 'vuetify-list-with-details-restrict',
    label: 'List With Details Restrict (Vuetify)',
    data,
    schema,
    uischema,
  },
])
