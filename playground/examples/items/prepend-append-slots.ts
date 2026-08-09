import { registerExamples } from '../register'

/**
 * Leading / trailing icons (`options.leadingIcon` / `trailingIcon`).
 *
 * - `iconPlacement: 'outside'` (default) — beside the widget
 * - `iconPlacement: 'inside'` — Nuxt UI field chrome (UInput, …)
 */

export const schema = {
  type: 'object',
  properties: {
    displayName: {
      type: 'string',
      title: 'Nom affiché',
      description: 'Icône à côté du champ (outside)',
    },
    email: {
      type: 'string',
      format: 'email',
      title: 'E-mail',
      description: 'Icônes dans le champ (inside)',
    },
    amount: {
      type: 'number',
      title: 'Montant',
      description: 'Outside — UInputNumber n’a pas de chrome d’icônes',
      minimum: 0,
    },
    accepted: {
      type: 'boolean',
      title: 'Conditions acceptées',
      description: 'Outside — checkbox / switch',
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Label',
      text: 'À côté du contrôle (outside)',
    },
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
    {
      type: 'Label',
      text: 'Dans le champ (inside)',
    },
    {
      type: 'Control',
      scope: '#/properties/email',
      options: {
        leadingIcon: 'i-lucide-mail',
        trailingIcon: 'i-lucide-check',
        iconPlacement: 'inside',
        placeholder: 'vous@exemple.fr',
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
