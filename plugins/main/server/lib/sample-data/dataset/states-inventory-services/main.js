const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomService() {
  const linux = Math.random() >= 0.5;
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

  const processName = linux
    ? random.choice(['nginx', 'sshd', 'cron'])
    : random.choice(['wuauserv', 'winlogon', 'svchost']);

  const state = linux
    ? random.choice(['active', 'inactive', 'failed'])
    : random.choice(['RUNNING', 'STOPPED']);

  return {
    architecture: random.choice(['x86_64', 'arm64']),
    hostname: `host${random.int(0, 1000)}`,
    service: {
      id: processName,
      name: processName.charAt(0).toUpperCase() + processName.slice(1),
      state: state,
      sub_state: linux ? random.choice(['running', 'dead', 'exited']) : null,
      description: `${processName} service`,
      exit_code:
        state === 'active' || state === 'RUNNING' ? 0 : random.int(1, 5),
      win32_exit_code: linux
        ? null
        : state === 'STOPPED'
        ? random.int(1, 5)
        : 0,
      address: linux
        ? `/lib/${processName}.so`
        : `C:\\Windows\\System32\\${processName}.dll`,
      enabled: linux ? random.choice(['enabled', 'disabled', 'static']) : null,
      type: linux
        ? 'system'
        : random.choice(['OWN_PROCESS', 'WIN32_SHARE_PROCESS']),
      following: linux ? random.choice(['none', 'multi-user.target']) : null,
      object_path: linux ? `/org/freedesktop/${processName}` : null,
      start_type: linux
        ? null
        : random.choice(['AUTO_START', 'DEMAND_START', 'DISABLED']),
      target: {
        ephemeral_id: String(random.int(1, 9999)),
        type: random.choice(['start', 'stop']),
        address: linux
          ? `/systemd/job${processName}`
          : `C:\\Jobs\\${processName}`,
      },
    },
    process: {
      pid: random.int(1, 9999),
      executable: linux
        ? `/usr/bin/${processName}`
        : `${random.choice([
            'C:\\Program Files\\App\\app.exe',
            'C:\\Windows\\System32\\svchost.exe',
          ])}`,
    },
    file: {
      path: linux
        ? `/usr/lib/systemd/system/${processName}.service`
        : `C:\\Windows\\System32\\${processName}.exe`,
    },
    user: {
      name: random.choice(names),
    },
  };
}
function generateDocument(params) {
  return {
    agent: generateRandomAgent(),
    host: generateRandomService(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
