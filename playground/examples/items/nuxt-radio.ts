import { registerExamples } from '../register'

export const data = {
  plan: 'pro',
  size: 'M',
  skills: ['vue', 'typescript'],
}

export const schema = {
  type: 'object',
  properties: {
    plan: {
      type: 'string',
      title: 'Formule',
      description: 'options.format: "radio" + radioGroup.variant: "list".',
      oneOf: [
        { const: 'free', title: 'Gratuit' },
        { const: 'pro', title: 'Pro' },
        { const: 'enterprise', title: 'Entreprise' },
      ],
    },
    size: {
      type: 'string',
      title: 'Taille',
      description: 'Radio horizontale via options.vertical: false.',
      enum: ['XS', 'S', 'M', 'L', 'XL'],
    },
    skills: {
      type: 'array',
      title: 'Compétences',
      description: 'Multi-enum → UCheckboxGroup (array + items.enum).',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['vue', 'typescript', 'css', 'node'],
      },
    },
  },
  required: ['plan'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/plan',
      options: {
        format: 'radio',
        radioGroup: {
          variant: 'list',
          size: 'md',
          color: 'primary',
        },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/size',
      options: {
        format: 'radio',
        vertical: false,
        radioGroup: {
          variant: 'list',
          size: 'md',
          color: 'primary',
        },
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/skills',
      options: {
        vertical: false,
        checkboxGroup: { size: 'sm' },
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-radio',
    label: 'Nuxt UI — Radio & Multi-enum',
    data,
    schema,
    uischema,
  },
])
