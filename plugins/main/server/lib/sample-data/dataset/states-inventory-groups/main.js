const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');
const {
  loadKnownFields,
  buildNestedObject,
  getFieldsByNamespace,
} = require('../../lib/known-fields-reader');

function generateRandomLetters(count) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: count }, () =>
    random.choice(letters.split('')),
  ).join('');
}

// Shared data arrays (no duplication)
const descriptions = [
  "Les membres du groupe Administrateurs disposent d'un accès complet et illimité à l'ordinateur et au domaine",
  "Les utilisateurs ne peuvent pas effectuer de modifications accidentelles ou intentionnelles à l'échelle du système",
  'Groupe intégré utilisé par les services Internet (IIS)',
  'Les membres de ce groupe ont le droit de se connecter à distance à cet ordinateur',
  'Les membres de ce groupe peuvent sauvegarder et restaurer des fichiers sur cet ordinateur',
  null,
];

const names = [
  'Administrateurs',
  'Administrators',
  'Admin Group',
  'root',
  'wheel',
  'sys',
  'Utilisateurs',
  'Users',
  'Standard Users',
  'sudo',
  'adm',
  'IIS_IUSRS',
  'WWW-Data',
  'Web Users',
  'daemon',
  'bin',
  'docker',
  'container',
  'virtualization',
  'wazuh',
  'security',
  'monitoring',
];

const userGroups = [
  ['administrator', 'admin.local', 'john.doe'],
  ['admin', 'root', 'superuser'],
  ['root'],
  ['system'],
  ['marie.martin', 'pierre.dubois', 'guest.user'],
  ['user1', 'user2', 'guest'],
  ['wazuh.agent'],
  ['security.service', 'monitor.user'],
];

function generateRandomGroup() {
  try {
    // Try to use known fields first
    const knownFields = loadKnownFields('states-inventory-groups');
    const groupFields = getFieldsByNamespace(knownFields, 'group');

    if (groupFields.length > 0) {
      // Use known fields with shared data arrays
      const customGenerators = {
        'group.description': () => random.choice(descriptions),
        'group.name': () => random.choice(names),
        'group.users': () => random.choice(userGroups),
        'group.id': () => random.int(0, 999),
        'group.id_signed': function () {
          return this['group.id'] || random.int(0, 999);
        },
        'group.uuid': () => {
          return `${generateRandomLetters(5)}${random.int(
            100000000,
            999999999,
          )}${random.int(1000, 9999)}`;
        },
      };

      const groupData = buildNestedObject(groupFields, customGenerators);

      // Ensure id_signed matches id for consistency
      if (groupData.group && groupData.group.id !== undefined) {
        groupData.group.id_signed = groupData.group.id;
      }

      return groupData.group || {};
    }
  } catch (error) {
    console.warn(
      'Could not load known fields, using legacy generation:',
      error.message,
    );
  }

  // Legacy generation (using shared arrays)
  const id = random.int(0, 999);
  const isHidden = random.choice([true, false]);

  return {
    description: random.choice(descriptions),
    id: id,
    id_signed: id,
    is_hidden: isHidden,
    name: random.choice(names),
    users: random.choice(userGroups),
    uuid: `${generateRandomLetters(5)}${random.int(
      100000000,
      999999999,
    )}${random.int(1000, 9999)}`,
  };
}

function generateDocument(params) {
  return {
    agent: generateRandomAgent(),
    group: generateRandomGroup(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
