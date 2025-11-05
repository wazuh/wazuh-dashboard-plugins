const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
} = require('../../shared-utils');

function generateRandomLetters(count) {
  const letters = 'abcdefghijqlmnopqrstuvwyz';
  return Array.from({ length: count }, () =>
    random.choice(letters.split('')),
  ).join('');
}

function generateRandomGroup() {
  // Unified group data structure with all possible combinations
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
    'Utilisateurs du Bureau à distance',
    'Remote Desktop Users',
    'RDP Users',
    'docker',
    'container',
    'virtualization',
    'Opérateurs de sauvegarde',
    'Backup Operators',
    'Backup Users',
    'wazuh',
    'security',
    'monitoring',
  ];

  const userGroups = [
    ['administrator', 'admin.local', 'john.doe'],
    ['admin', 'root', 'superuser'],
    ['administrator', 'system.admin'],
    ['root'],
    ['root', 'admin'],
    ['system'],
    ['marie.martin', 'pierre.dubois', 'guest.user', 'service.account'],
    ['user1', 'user2', 'guest'],
    ['standard.user', 'limited.user'],
    ['john.doe', 'sysadmin'],
    ['admin.user', 'sudo.user'],
    ['privileged.user'],
    ['iis.service', 'web.admin'],
    ['www-data', 'apache'],
    ['nginx.user', 'web.service'],
    ['daemon', 'system.service'],
    ['bin', 'sys'],
    ['service.daemon'],
    ['admin.local', 'support.tech'],
    ['remote.user', 'rdp.admin'],
    ['desktop.user'],
    ['developer.user'],
    ['docker.user', 'container.admin'],
    ['dev.user'],
    ['backup.service'],
    ['backup.user', 'restore.admin'],
    ['backup.operator'],
    ['wazuh.agent'],
    ['security.service', 'monitor.user'],
    ['wazuh.service'],
  ];

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
    state: generateRandomState(),

    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
