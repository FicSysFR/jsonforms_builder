import { registerExamples } from '../register'

/**
 * posixGroup (nis.schema / RFC 2307) — Unix group.
 * MUST: cn, gidNumber. Members via memberUid (login), not DN.
 */
export const schema = {
  type: 'object',
  title: 'posixGroup',
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
      default: ['top', 'posixGroup'],
      minItems: 1,
      uniqueItems: true,
    },
    cn: {
      type: 'string',
      title: 'cn',
      description: 'MUST — nom du groupe',
      minLength: 1,
    },
    gidNumber: {
      type: 'integer',
      title: 'gidNumber',
      description: 'MUST',
      minimum: 1000,
    },
    memberUid: {
      type: 'array',
      title: 'memberUid',
      description: 'Logins Unix des membres',
      items: {
        type: 'string',
        pattern: '^[a-z_][a-z0-9_-]*$',
        title: 'uid',
      },
      uniqueItems: true,
    },
    userPassword: {
      type: 'string',
      format: 'password',
      title: 'userPassword',
      description: 'Mot de passe de groupe (rarement utilisé)',
    },
    description: {
      type: 'string',
      title: 'description',
    },
  },
  required: ['dn', 'cn', 'gidNumber'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: 'Groupe POSIX (nis.schema)' },
    { type: 'Control', scope: '#/properties/dn' },
    { type: 'Control', scope: '#/properties/objectClass' },
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/cn' },
        { type: 'Control', scope: '#/properties/gidNumber' },
      ],
    },
    {
      type: 'Control',
      scope: '#/properties/memberUid',
      options: {
        showSortButtons: true,
        suggestion: ['jdoe', 'asmith', 'blee', 'root', 'nobody'],
      },
    },
    { type: 'Control', scope: '#/properties/userPassword' },
    { type: 'Control', scope: '#/properties/description' },
  ],
}

const data = {
  dn: 'cn=developers,ou=groups,dc=example,dc=com',
  objectClass: ['top', 'posixGroup'],
  cn: 'developers',
  gidNumber: 10001,
  memberUid: ['jdoe', 'asmith', 'blee'],
  description: 'Développeurs — accès aux serveurs de build',
}

registerExamples([
  {
    name: 'openldap-posixGroup',
    label: 'OpenLDAP — posixGroup',
    data,
    schema,
    uischema,
  },
])
