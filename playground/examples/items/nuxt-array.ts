import { registerExamples } from '../register'

export const data = {
  contacts: [
    { name: 'Camille Dupont', email: 'camille@exemple.fr', role: 'admin' },
    { name: 'Alex Martin', email: 'alex@exemple.fr', role: 'editor' },
  ],
}

export const schema = {
  type: 'object',
  properties: {
    contacts: {
      type: 'array',
      title: 'Contacts',
      description:
        'Cartes répétables Nuxt UI — showSortButtons + elementLabelProp + detail.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Nom' },
          email: { type: 'string', title: 'E-mail', format: 'email' },
          role: {
            type: 'string',
            title: 'Rôle',
            enum: ['viewer', 'editor', 'admin'],
          },
        },
        required: ['name', 'email'],
      },
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/contacts',
      options: {
        showSortButtons: true,
        elementLabelProp: 'name',
        showUnfocusedDescription: true,
        detail: {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/name' },
                { type: 'Control', scope: '#/properties/email' },
              ],
            },
            {
              type: 'Control',
              scope: '#/properties/role',
              options: { format: 'select' },
            },
          ],
        },
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-array',
    label: 'Nuxt UI — Array',
    data,
    schema,
    uischema,
  },
])
