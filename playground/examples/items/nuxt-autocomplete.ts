import { registerExamples } from '../register'

export const data = {}

export const schema = {
  type: 'object',
  properties: {
    addressId: {
      type: 'string',
      title: 'Adresse',
      description:
        'options.api → UInputMenu. Recherche Géoportail (min. 3 caractères).',
    },
    cityHint: {
      type: 'string',
      title: 'Ville (suggestions locales)',
      description: 'Sans api : suggestions locales via options.suggestion.',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/addressId',
      options: {
        placeholder: 'Rechercher une adresse…',
        minLength: 3,
        showUnfocusedDescription: true,
        api: {
          base: 'https://data.geopf.fr',
          url: '/geocodage/search',
          queryKey: 'q',
          params: {
            autocomplete: 1,
            index: 'address',
            limit: 10,
            returntruegeometry: false,
          },
          itemsPath: 'features',
          labelKey: 'properties.label',
          valueKey: 'properties.id',
          headers: {
            accept: 'application/json',
          },
        },
        inputMenu: { size: 'md' },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/cityHint',
      options: {
        placeholder: 'Commencer à taper…',
        suggestion: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes', 'Bordeaux'],
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-autocomplete',
    label: 'Nuxt UI — Autocomplete API',
    data,
    schema,
    uischema,
  },
])
