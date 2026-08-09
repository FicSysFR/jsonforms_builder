import { registerExamples } from '../register'

export const data = {
  firstName: 'Camille',
  lastName: 'Dupont',
  email: 'camille@exemple.fr',
  phone: '',
  notes: '',
}

export const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'Prénom' },
    lastName: { type: 'string', title: 'Nom' },
    email: { type: 'string', title: 'E-mail', format: 'email' },
    phone: { type: 'string', title: 'Téléphone' },
    notes: { type: 'string', title: 'Notes' },
  },
  required: ['firstName', 'lastName', 'email'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Label',
      text: 'Profil utilisateur',
      options: { level: 2 },
    },
    {
      type: 'Group',
      label: 'Identité',
      options: {
        card: { variant: 'subtle' },
      },
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/firstName' },
            { type: 'Control', scope: '#/properties/lastName' },
          ],
        },
      ],
    },
    {
      type: 'Categorization',
      options: {
        queryKey: 'section',
        defaultTab: 'contact',
        tabs: { size: 'sm' },
      },
      elements: [
        {
          type: 'Category',
          label: 'Contact',
          options: { queryId: 'contact' },
          elements: [
            { type: 'Control', scope: '#/properties/email' },
            { type: 'Control', scope: '#/properties/phone' },
          ],
        },
        {
          type: 'Category',
          label: 'Notes',
          options: { queryId: 'notes' },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/notes',
              options: { multi: true, minRows: 3, rows: 8 },
            },
          ],
        },
      ],
    },
    {
      type: 'Label',
      text: 'Sans séparateur',
      options: { level: 4, separator: false },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-layouts',
    label: 'Nuxt UI — Layouts',
    data,
    schema,
    uischema,
  },
])
