const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
} = require('../shared-utils');

function generateRandomLetters(count) {
  const letters = 'abcdefghijqlmnopqrstuvwyz';
  return Array.from({ length: count }, () =>
    random.choice(letters.split('')),
  ).join('');
}

function generateRandomHost() {
  return {
    ip: random.ip(),
  };
}

function generateRandomLogin() {
  return {
    status: random.boolean(),
    tty: random.choice([
      'pts/0',
      'pts/1',
      'pts/2',
      'pts/3',
      'console',
      'rdp-tcp#0',
      'rdp-tcp#1',
      'services',
      'systemd',
    ]),
    type: random.choice(['user', 'admin', 'remote', 'service']),
  };
}

function generateRandomProcess() {
  return {
    pid: random.int(1000, 9999),
  };
}

function generateRandomUser() {
  const names = [
    'administrator',
    'root',
    'john.doe',
    'marie.martin',
    'admin.local',
    'sysadmin',
    'developer.user',
    'support.tech',
    'wazuh.agent',
    'backup.service',
    'system.service',
    'web.service',
  ];

  const fullNames = [
    'System Administrator',
    'root',
    'John Doe',
    'Marie Martin',
    'Local Administrator',
    'Software Developer',
    'Technical Support',
    'Wazuh Agent Service',
    'Backup Service Account',
    'System Service',
    'Web Service Account',
  ];

  const shells = [
    '/bin/bash',
    '/sbin/nologin',
    '/bin/sh',
    'cmd.exe',
    'powershell.exe',
  ];

  const homes = [
    '/root',
    '/home/john.doe',
    '/home/sysadmin',
    '/home/developer',
    '/var/ossec',
    'C:\\Users\\Administrator',
    'C:\\Users\\admin.local',
    'C:\\Users\\marie.martin',
    'C:\\Windows\\ServiceProfiles\\BackupService',
  ];

  const roles = ['admin', 'user', 'service', 'sudo', 'support'];
  const hashAlgorithms = ['SHA256', 'SHA512', 'NTLM'];
  const userTypes = ['local', 'domain', 'service'];

  const groupId = random.int(0, 999);
  const userId = random.int(500, 999);
  const authFailureCount = random.int(0, 5);

  return {
    auth_failures: {
      count: authFailureCount,
      timestamp: authFailureCount > 0 ? random.date() : null,
    },
    created: random.date(),
    full_name: random.choice(fullNames),
    group: {
      id: groupId,
      id_signed: groupId,
    },
    groups: String(random.int(0, 1000)),
    home: random.choice(homes),
    id: random.choice(names),
    is_hidden: random.boolean(),
    is_remote: random.boolean(),
    last_login: random.date(),
    name: random.choice(names),
    password: {
      expiration_date: random.date(),
      hash_algorithm: random.choice(hashAlgorithms),
      inactive_days: random.int(0, 30),
      last_change: random.unixTimestamp(),
      max_days_between_changes: random.int(90, 180),
      min_days_between_changes: random.int(0, 1),
      status: random.choice(['active', 'locked']),
      warning_days_before_expiration: random.int(7, 30),
    },
    roles: random.choice(roles),
    shell: random.choice(shells),
    type: random.choice(userTypes),
    uid_signed: userId,
    uuid: `${generateRandomLetters(5)}${random.int(
      100000000,
      999999999,
    )}${random.int(1000, 9999)}`,
  };
}

function generateDocument(params) {
  return {
    agent: generateRandomAgent(),
    host: generateRandomHost(),
    login: generateRandomLogin(),
    process: generateRandomProcess(),
    user: generateRandomUser(),
    state: generateRandomState(),

    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
