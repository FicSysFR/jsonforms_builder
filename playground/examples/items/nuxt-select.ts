import { registerExamples } from '../register'

export const data = {
  size: 'M',
}

export const schema = {
  type: 'object',
  properties: {
    size: {
      type: 'string',
      title: 'Taille',
      description: 'options.format: "select" — liste sobre, sans champ de recherche.',
      enum: ['XS', 'S', 'M', 'L', 'XL'],
    },
    priority: {
      type: 'string',
      title: 'Priorité',
      description: 'Enum exprimé en oneOf : les titres servent de libellés.',
      oneOf: [
        { const: 'low', title: 'Basse' },
        { const: 'normal', title: 'Normale' },
        { const: 'high', title: 'Haute' },
      ],
    },
    country: {
      type: 'string',
      title: 'Pays',
      description: 'Sans l’option : USelectMenu par défaut, avec sa recherche.',
      enum: ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'],
    },
  },
  required: ['size'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/size',
      options: {
        format: 'select',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/priority',
      options: {
        format: 'select',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/country',
      options: {
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-select',
    label: 'Nuxt UI — Select',
    data,
    schema,
    uischema,
  },
])
