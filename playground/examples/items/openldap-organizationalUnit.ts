import { registerExamples } from '../register'

/**
 * organizationalUnit (core.schema / RFC 4519) — unité organisationnelle.
 * MUST : ou. Souvent utilisé pour structurer l’arbre (ou=people, ou=groups…).
 */
export const schema = {
  type: 'object',
  title: 'organizationalUnit',
  properties: {
    dn: {
      type: 'string',
      title: 'DN',
      pattern: '^.+=.+(,.+=.+)*$',
    },
    objectClass: {
      type: 'array',
      title: 'objectClass',
      items: { type: 'string' },
      default: ['top', 'organizationalUnit'],
      minItems: 1,
      uniqueItems: true,
    },
    ou: {
      type: 'string',
      title: 'ou',
      description: 'MUST — nom de l’unité',
      minLength: 1,
    },
    description: {
      type: 'array',
      title: 'description',
      items: { type: 'string' },
    },
    businessCategory: {
      type: 'array',
      title: 'businessCategory',
      items: { type: 'string' },
    },
    seeAlso: {
      type: 'array',
      title: 'seeAlso',
      items: {
        type: 'string',
        pattern: '^.+=.+(,.+=.+)*$',
      },
    },
    telephoneNumber: {
      type: 'array',
      title: 'telephoneNumber',
      items: { type: 'string' },
    },
    facsimileTelephoneNumber: {
      type: 'array',
      title: 'facsimileTelephoneNumber',
      items: { type: 'string' },
    },
    street: {
      type: 'array',
      title: 'street',
      items: { type: 'string' },
    },
    l: {
      type: 'array',
      title: 'l (locality)',
      items: { type: 'string' },
    },
    st: {
      type: 'array',
      title: 'st (stateOrProvince)',
      items: { type: 'string' },
    },
    postalCode: {
      type: 'array',
      title: 'postalCode',
      items: { type: 'string' },
    },
    postalAddress: {
      type: 'array',
      title: 'postalAddress',
      items: { type: 'string' },
    },
    postOfficeBox: {
      type: 'array',
      title: 'postOfficeBox',
      items: { type: 'string' },
    },
    physicalDeliveryOfficeName: {
      type: 'array',
      title: 'physicalDeliveryOfficeName',
      items: { type: 'string' },
    },
  },
  required: ['dn', 'ou'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Unité organisationnelle (core.schema)' },
    {
      type: 'Group',
      label: 'Entrée',
      elements: [
        { type: 'Control', scope: '#/properties/dn' },
        { type: 'Control', scope: '#/properties/objectClass' },
        { type: 'Control', scope: '#/properties/ou' },
        { type: 'Control', scope: '#/properties/description' },
        { type: 'Control', scope: '#/properties/businessCategory' },
        { type: 'Control', scope: '#/properties/seeAlso' },
      ],
    },
    {
      type: 'Group',
      label: 'Contact',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/telephoneNumber' },
            { type: 'Control', scope: '#/properties/facsimileTelephoneNumber' },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/street' },
            { type: 'Control', scope: '#/properties/l' },
            { type: 'Control', scope: '#/properties/st' },
            { type: 'Control', scope: '#/properties/postalCode' },
          ],
        },
        { type: 'Control', scope: '#/properties/postalAddress' },
        { type: 'Control', scope: '#/properties/postOfficeBox' },
        { type: 'Control', scope: '#/properties/physicalDeliveryOfficeName' },
      ],
    },
  ],
}

const data = {
  dn: 'ou=people,dc=example,dc=com',
  objectClass: ['top', 'organizationalUnit'],
  ou: 'people',
  description: ['Comptes utilisateurs de Example Corp'],
  businessCategory: ['Identity'],
  telephoneNumber: ['+33 1 23 45 67 00'],
  street: ['1 rue de l’Exemple'],
  l: ['Paris'],
  st: ['Île-de-France'],
  postalCode: ['75001'],
}

registerExamples([
  {
    name: 'openldap-organizationalUnit',
    label: 'OpenLDAP — organizationalUnit',
    data,
    schema,
    uischema,
  },
])
