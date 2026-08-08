import { registerExamples } from '../register'

/**
 * Entrée utilisateur réaliste : plusieurs objectClasses empilées via `allOf`
 * (inetOrgPerson + posixAccount + ldapPublicKey), pattern très courant sous OpenLDAP.
 */
export const schema = {
  type: 'object',
  title: 'Entrée utilisateur OpenLDAP',
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
      default: [
        'top',
        'person',
        'organizationalPerson',
        'inetOrgPerson',
        'posixAccount',
        'shadowAccount',
        'ldapPublicKey',
      ],
      minItems: 1,
      uniqueItems: true,
    },
    entry: {
      title: 'Attributs',
      allOf: [
        {
          title: 'inetOrgPerson',
          type: 'object',
          required: ['cn', 'sn'],
          properties: {
            cn: {
              type: 'array',
              title: 'cn',
              items: { type: 'string', minLength: 1 },
              minItems: 1,
            },
            sn: {
              type: 'array',
              title: 'sn',
              items: { type: 'string', minLength: 1 },
              minItems: 1,
            },
            givenName: {
              type: 'array',
              title: 'givenName',
              items: { type: 'string' },
            },
            displayName: { type: 'string', title: 'displayName' },
            mail: {
              type: 'array',
              title: 'mail',
              items: { type: 'string', format: 'email' },
            },
            telephoneNumber: {
              type: 'array',
              title: 'telephoneNumber',
              items: { type: 'string' },
            },
            mobile: {
              type: 'array',
              title: 'mobile',
              items: { type: 'string' },
            },
            title: {
              type: 'array',
              title: 'title',
              items: { type: 'string' },
            },
            ou: {
              type: 'array',
              title: 'ou',
              items: { type: 'string' },
            },
            employeeNumber: { type: 'string', title: 'employeeNumber' },
            departmentNumber: {
              type: 'array',
              title: 'departmentNumber',
              items: { type: 'string' },
            },
          },
        },
        {
          title: 'posixAccount',
          type: 'object',
          required: ['uid', 'uidNumber', 'gidNumber', 'homeDirectory'],
          properties: {
            uid: {
              type: 'array',
              title: 'uid',
              items: {
                type: 'string',
                pattern: '^[a-z_][a-z0-9_-]*$',
              },
              minItems: 1,
            },
            uidNumber: {
              type: 'integer',
              title: 'uidNumber',
              minimum: 1000,
            },
            gidNumber: {
              type: 'integer',
              title: 'gidNumber',
              minimum: 1000,
            },
            homeDirectory: {
              type: 'string',
              title: 'homeDirectory',
              pattern: '^/.*',
            },
            loginShell: {
              type: 'string',
              title: 'loginShell',
              enum: ['/bin/bash', '/bin/sh', '/bin/zsh', '/sbin/nologin'],
              default: '/bin/bash',
            },
            gecos: { type: 'string', title: 'gecos' },
            userPassword: {
              type: 'string',
              format: 'password',
              title: 'userPassword',
              minLength: 8,
            },
          },
        },
        {
          title: 'ldapPublicKey (openssh-lpk)',
          type: 'object',
          properties: {
            sshPublicKey: {
              type: 'array',
              title: 'sshPublicKey',
              description: 'Clés publiques OpenSSH',
              items: {
                type: 'string',
                pattern: '^(ssh-(rsa|ed25519)|ecdsa-sha2-nistp(256|384|521)|sk-ssh-ed25519@openssh\\.com) .+',
              },
            },
          },
        },
      ],
    },
  },
  required: ['dn', 'entry'],
}

export const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Label',
      text: 'Utilisateur OpenLDAP (inetOrgPerson + posixAccount + ldapPublicKey)',
    },
    { type: 'Control', scope: '#/properties/dn' },
    { type: 'Control', scope: '#/properties/objectClass' },
    { type: 'Control', scope: '#/properties/entry' },
  ],
}

const data = {
  dn: 'uid=jdoe,ou=people,dc=example,dc=com',
  objectClass: [
    'top',
    'person',
    'organizationalPerson',
    'inetOrgPerson',
    'posixAccount',
    'shadowAccount',
    'ldapPublicKey',
  ],
  entry: {
    cn: ['Jane Doe'],
    sn: ['Doe'],
    givenName: ['Jane'],
    displayName: 'Jane Doe',
    mail: ['jane.doe@example.com'],
    telephoneNumber: ['+33 1 23 45 67 89'],
    mobile: ['+33 6 12 34 56 78'],
    title: ['Ingénieure système'],
    ou: ['IT'],
    employeeNumber: 'E-1042',
    departmentNumber: ['IT-OPS'],
    uid: ['jdoe'],
    uidNumber: 10042,
    gidNumber: 10000,
    homeDirectory: '/home/jdoe',
    loginShell: '/bin/bash',
    gecos: 'Jane Doe',
    sshPublicKey: [
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyMaterial jane@laptop',
    ],
  },
}

registerExamples([
  {
    name: 'openldap-user-entry',
    label: 'OpenLDAP — utilisateur (allOf multi-objectClass)',
    data,
    schema,
    uischema,
  },
])
