import { registerExamples } from '../register'

/**
 * Leading / trailing icons beside controls (`options.leadingIcon` / `trailingIcon`).
 *
 * For icons *inside* UInput chrome, use pass-through instead:
 * `options.input: { leadingIcon: 'i-lucide-…' }`.
 */

export const schema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: 'Nom affiché',
      description: 'Icône décorative avant le champ',
    },
    email: {
      type: 'string',
      format: 'email',
      title: 'E-mail',
      description: 'Icônes avant et après',
    },
    amount: {
      type: 'number',
      title: 'Montant',
      description: 'Suffixe € via trailingIcon',
      minimum: 0,
    },
    accepted: {
      type: 'boolean',
      title: 'Conditions acceptées',
      description: 'Fonctionne aussi sur checkbox / switch',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/displayName',
      options: {
        leadingIcon: 'i-lucide-user',
        placeholder: 'Camille Dupont',
      },
    },
    {
      type: 'Control',
      scope: '#/properties/email',
      options: {
        leadingIcon: 'i-lucide-mail',
        trailingIcon: 'i-lucide-check',
        placeholder: 'vous@exemple.fr',
      },
    },
    {
      type: 'Control',
      scope: '#/properties/amount',
      options: {
        leadingIcon: 'i-lucide-wallet',
        trailingIcon: 'i-lucide-euro',
        placeholder: '0.00',
      },
    },
    {
      type: 'Control',
      scope: '#/properties/accepted',
      options: {
        leadingIcon: 'i-lucide-shield-check',
      },
    },
  ],
}

export const data = {
  displayName: 'Camille Dupont',
  email: 'camille@exemple.fr',
  amount: 42,
  accepted: false,
}

registerExamples([
  {
    name: 'prepend-append-slots',
    label: 'Leading / Trailing Icons',
    data,
    schema,
    uischema,
  },
])
