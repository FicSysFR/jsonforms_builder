import { registerExamples } from '../register'

/**
 * groupOfNames (core.schema / RFC 4519) — groupe LDAP classique.
 * MUST : cn, member (au moins un DN).
 */
export const schema = {
  type: 'object',
  title: 'groupOfNames',
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
      default: ['top', 'groupOfNames'],
      minItems: 1,
      uniqueItems: true,
    },
    cn: {
      type: 'string',
      title: 'cn',
      description: 'MUST',
      minLength: 1,
    },
    member: {
      type: 'array',
      title: 'member',
      description: 'MUST — DN des membres',
      items: {
        type: 'string',
        pattern: '^.+=.+(,.+=.+)*$',
        title: 'DN membre',
      },
      minItems: 1,
      uniqueItems: true,
    },
    owner: {
      type: 'array',
      title: 'owner',
      items: {
        type: 'string',
        pattern: '^.+=.+(,.+=.+)*$',
      },
    },
    ou: {
      type: 'array',
      title: 'ou',
      items: { type: 'string' },
    },
    o: {
      type: 'array',
      title: 'o',
      items: { type: 'string' },
    },
    businessCategory: {
      type: 'array',
      title: 'businessCategory',
      items: { type: 'string' },
    },
    description: {
      type: 'array',
      title: 'description',
      items: { type: 'string' },
    },
  },
  required: ['dn', 'cn', 'member'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Groupe groupOfNames (core.schema)' },
    { type: 'Control', scope: '#/properties/dn' },
    { type: 'Control', scope: '#/properties/objectClass' },
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/cn' },
        { type: 'Control', scope: '#/properties/ou' },
        { type: 'Control', scope: '#/properties/o' },
      ],
    },
    {
      type: 'Control',
      scope: '#/properties/member',
      options: { showSortButtons: true },
    },
    { type: 'Control', scope: '#/properties/owner' },
    { type: 'Control', scope: '#/properties/businessCategory' },
    { type: 'Control', scope: '#/properties/description' },
  ],
}

const data = {
  dn: 'cn=admins,ou=groups,dc=example,dc=com',
  objectClass: ['top', 'groupOfNames'],
  cn: 'admins',
  member: [
    'uid=jdoe,ou=people,dc=example,dc=com',
    'uid=asmith,ou=people,dc=example,dc=com',
    'uid=blee,ou=people,dc=example,dc=com',
  ],
  owner: ['uid=jdoe,ou=people,dc=example,dc=com'],
  ou: ['groups'],
  o: ['Example Corp'],
  businessCategory: ['IT'],
  description: ['Administrateurs système et LDAP'],
}

registerExamples([
  {
    name: 'openldap-groupOfNames',
    label: 'OpenLDAP — groupOfNames',
    data,
    schema,
    uischema,
  },
])
