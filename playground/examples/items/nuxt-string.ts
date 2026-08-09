import { registerExamples } from '../register'

export const data = {
  displayName: 'Camille Dupont',
  slug: 'camille-dupont',
}

export const schema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: 'Nom affiché',
      description: 'UInput — options.input pour size / color / ui.',
    },
    slug: {
      type: 'string',
      title: 'Slug',
      description: 'options.restrict + schema.maxLength → compteur de caractères.',
      maxLength: 32,
    },
    bio: {
      type: 'string',
      title: 'Biographie',
      description: 'options.multi: true → UTextarea avec autoresize.',
    },
    password: {
      type: 'string',
      title: 'Mot de passe',
      description: 'schema format: "password" — bascule afficher / masquer intégrée.',
      format: 'password',
      minLength: 8,
    },
  },
  required: ['displayName', 'password'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/displayName',
      options: {
        placeholder: 'Camille Dupont',
        input: { size: 'lg' },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/slug',
      options: {
        restrict: true,
        placeholder: 'camille-dupont',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/bio',
      options: {
        multi: true,
        minRows: 3,
        rows: 8,
        placeholder: 'Quelques mots…',
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/password',
      options: {
        placeholder: '••••••••',
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-string',
    label: 'Nuxt UI — String & Textarea',
    data,
    schema,
    uischema,
  },
])
