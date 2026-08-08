import { registerExamples } from '../register'

export const data = {
  otp: '482913',
}

export const schema = {
  type: 'object',
  properties: {
    otp: {
      type: 'string',
      title: 'Code de vérification',
      description: 'Les 6 chiffres reçus par SMS. La longueur est déduite du motif.',
      pattern: '^\\d{6}$',
    },
    pin: {
      type: 'string',
      title: 'Code confidentiel',
      description: 'Masqué à la saisie, longueur donnée par maxLength.',
      minLength: 4,
      maxLength: 4,
    },
    coupon: {
      type: 'string',
      title: 'Code promotionnel',
      description: 'Alphanumérique, longueur imposée par le uischema.',
    },
  },
  required: ['otp'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/otp',
      options: {
        format: 'pin',
        otp: true,
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/pin',
      options: {
        format: 'pin',
        mask: true,
        showUnfocusedDescription: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/coupon',
      options: {
        format: 'pin',
        length: 8,
        type: 'text',
        showUnfocusedDescription: true,
      },
    },
  ],
}

registerExamples([
  {
    name: 'nuxt-pin-input',
    label: 'Nuxt UI — Pin Input',
    data,
    schema,
    uischema,
  },
])
