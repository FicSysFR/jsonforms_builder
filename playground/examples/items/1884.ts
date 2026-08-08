import { registerExamples } from '../register'

export const schema = {
  type: 'object',
  required: ['age', 'committer'],
  properties: {
    firstName: {
      type: 'string',
      minLength: 2,
      maxLength: 20,
    },
    lastName: {
      type: 'string',
      minLength: 5,
      maxLength: 15,
      description: 'Your last name',
    },
    age: {
      type: 'integer',
      minimum: 18,
      maximum: 100,
    },
    gender: {
      type: 'string',
      enum: ['Male', 'Female', 'Undisclosed'],
      description: 'Your gender',
    },
    height: {
      type: 'number',
    },
    dateOfBirth: {
      type: 'string',
      format: 'date',
    },
    rating: {
      type: 'integer',
    },
    committer: {
      type: 'boolean',
      description: 'Are you a committer?',
    },
    address: {
      type: 'object',
      properties: {
        street: {
          type: 'string',
          minLength: 2,
        },
        streetnumber: {
          type: 'string',
        },
        postalCode: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
      },
    },
  },
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Label',
      text: 'Toggle the committer boolean to enable/disable the address block.',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/firstName',
        },
        {
          type: 'Control',
          scope: '#/properties/lastName',
        },
      ],
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/age',
        },
        {
          type: 'Control',
          scope: '#/properties/dateOfBirth',
          options: {
            pattern: 'DD/MM/YYYY',
          },
        },
      ],
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/height',
          options: {
            step: 0.01,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/gender',
        },
        {
          type: 'Control',
          scope: '#/properties/committer',
        },
      ],
    },
    {
      type: 'Group',
      label: 'Address for Shipping T-Shirt',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/address/properties/street',
            },
            {
              type: 'Control',
              scope: '#/properties/address/properties/streetnumber',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/address/properties/postalCode',
            },
            {
              type: 'Control',
              scope: '#/properties/address/properties/city',
            },
          ],
        },
      ],
      rule: {
        effect: 'ENABLE',
        condition: {
          scope: '#/properties/committer',
          schema: {
            const: true,
          },
        },
      },
    },
  ],
}

export const data = {
  firstName: 'M',
  lastName: 'Power',
  height: 1,
  committer: false,
  dateOfBirth: '22/11/1984',
}

registerExamples([
  {
    name: '1884',
    label: 'Issue 1884 - Nested enable/disable',
    data,
    schema,
    uischema,
  },
])
