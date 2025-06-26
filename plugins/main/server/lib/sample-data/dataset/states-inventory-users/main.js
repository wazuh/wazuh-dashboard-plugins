const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');
const { DateFormatter } = require('../../../generate-alerts/helpers/date-formatter');
const { Random } = require('../../../generate-alerts/helpers/random');

function generateRandomHost() {
  return {
    ip: [random.ip()],
  };
}

function generateRandomLogin() {
  return {
    status: random.boolean(),
    tty: [
      random.choice([
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
    ],
    type: [random.choice(['user', 'admin', 'remote', 'service'])],
  };
}

function generateRandomProcess() {
  return {
    pid: [random.int(1000, 9999)],
  };
}

function generateRandomUser() {
  const userTypes = ['local', 'domain', 'service'];
  const userType = random.choice(userTypes);
  const isService = userType === 'service';
  const isWindows = random.boolean();

  const names = isService
    ? ['wazuh.agent', 'backup.service', 'system.service', 'web.service']
    : [
        'administrator',
        'root',
        'john.doe',
        'marie.martin',
        'admin.local',
        'sysadmin',
        'developer.user',
        'support.tech',
      ];

  const fullNames = isService
    ? ['Wazuh Agent Service', 'Backup Service Account', 'System Service', 'Web Service Account']
    : [
        'System Administrator',
        'root',
        'John Doe',
        'Marie Martin',
        'Local Administrator',
        'System Administrator',
        'Software Developer',
        'Technical Support',
      ];

  const shells = isWindows
    ? ['cmd.exe', 'powershell.exe']
    : ['/bin/bash', '/sbin/nologin', '/bin/sh'];

  const homes = isWindows
    ? [
        'C:\\Users\\Administrator',
        'C:\\Users\\admin.local',
        'C:\\Users\\marie.martin',
        'C:\\Windows\\ServiceProfiles\\BackupService',
      ]
    : ['/root', '/home/john.doe', '/home/sysadmin', '/home/developer', '/var/ossec'];

  const roles = isService
    ? [['service']]
    : [['admin'], ['user'], ['user', 'sudo'], ['admin', 'sudo'], ['support']];

  const hashAlgorithms = isWindows ? ['NTLM'] : ['SHA256', 'SHA512'];

  const groupId = random.int(0, 1100);
  const userId = random.int(500, 1100);

  const hasAuthFailures = random.boolean();
  const authFailureCount = hasAuthFailures ? random.int(0, 5) : 0;

  const passwordStatus = isService && random.boolean() ? 'locked' : 'active';

  return {
    auth_failures: {
      count: authFailureCount,
      timestamp:
        authFailureCount > 0
          ? DateFormatter.format(Random.date(), DateFormatter.DATE_FORMAT.ISO_TIMESTAMP)
          : null,
    },
    created: DateFormatter.format(Random.date(), DateFormatter.DATE_FORMAT.ISO_TIMESTAMP),
    full_name: random.choice(fullNames),
    group: {
      id: groupId,
      id_signed: groupId,
    },
    groups: [String(random.int(0, 1000)), String(random.int(500, 600))],
    home: random.choice(homes),
    id: random.choice(names),
    is_hidden: isService ? random.boolean() : false,
    is_remote: random.boolean(),
    last_login: DateFormatter.format(Random.date(), DateFormatter.DATE_FORMAT.ISO_TIMESTAMP),
    name: random.choice(names),
    password: {
      expiration_date:
        passwordStatus === 'locked'
          ? '1970-01-01T00:00:00.000Z'
          : DateFormatter.format(Random.date(), DateFormatter.DATE_FORMAT.ISO_TIMESTAMP),
      hash_algorithm: random.choice(hashAlgorithms),
      inactive_days: passwordStatus === 'locked' ? -1 : random.int(0, 30),
      last_change: random.int(20000, 20300),
      last_set_time: DateFormatter.format(Random.date(), DateFormatter.DATE_FORMAT.ISO_TIMESTAMP),
      max_days_between_changes: passwordStatus === 'locked' ? -1 : random.int(90, 180),
      min_days_between_changes: passwordStatus === 'locked' ? -1 : random.int(0, 1),
      status: passwordStatus,
      warning_days_before_expiration: passwordStatus === 'locked' ? -1 : random.int(7, 30),
    },
    roles: random.choice(roles),
    shell: random.choice(shells),
    type: userType,
    uid_signed: userId,
    uuid: isWindows
      ? `S-1-5-21-${random.int(123456789, 987654321)}-${random.int(1001, 1010)}`
      : `LINUX-${isService ? 'SVC' : userType.toUpperCase()}-${userId}`,
  };
}

function generateDocument(params) {
  return {
    host: generateRandomHost(),
    login: generateRandomLogin(),
    process: generateRandomProcess(),
    user: generateRandomUser(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
