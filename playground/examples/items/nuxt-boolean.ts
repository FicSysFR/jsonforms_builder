import { registerExamples } from '../register'

export const data = {
  terms: false,
  newsletter: true,
}

export const schema = {
  type: 'object',
  properties: {
    terms: {
      type: 'boolean',
      title: 'J’accepte les conditions',
      description: 'Par défaut : UCheckbox. Pass-through via options.checkbox.',
    },
    newsletter: {
      type: 'boolean',
      title: 'Recevoir la newsletter',
      description: 'options.toggle: true → USwitch à la place de la case.',
    },
    darkMode: {
      type: 'boolean',
      title: 'Mode sombre',
      description: 'Interrupteur large, couleur success.',
    },
  },
  required: ['terms'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/terms',
      options: {
        checkbox: { color: 'primary' },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/newsletter',
      options: {
        toggle: true,
        switch: { size: 'md', color: 'primary' },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/darkMode',
      options: {
        toggle: true,
        switch: { size: 'lg', color: 'success' },
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-boolean',
    label: 'Nuxt UI — Boolean',
    data,
    schema,
    uischema,
  },
])
