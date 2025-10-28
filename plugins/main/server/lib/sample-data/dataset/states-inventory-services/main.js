const random = require('../../lib/random');
const {
  generateRandomWazuh,
  generateRandomAgent,
  generateRandomState,
} = require('../shared-utils');

function generateRandomService(os) {
  let service = {};
  if (os === 'linux') {
    const processName = random.choice(['nginx', 'sshd', 'cron']);
    const target = {
      ephemeral_id: String(random.int(1, 9999)),
      type: random.choice(['start', 'stop']),
      address: `/systemd/job${processName}`,
    };
    service.id = processName;
    service.description = `${processName} service`;
    service.state = random.choice(['active', 'inactive', 'failed']);
    service.sub_state = random.choice(['running', 'dead', 'exited']);
    service.enabled = random.choice(['enabled', 'disabled', 'static']);
    service.following = random.choice(['multi-user.target', 'none']);
    service.object_path = `/lib/systemd/system/${processName}.service`;
    service.target = target;
  } else if (os === 'windows') {
    const processName = random.choice(['wuauserv', 'winlogon', 'svchost']);
    service.id = processName;
    service.name = random.choice([
      'Windows Update',
      'Background Intelligent Transfer Service',
      'Windows Security Center',
    ]);
    service.description = `${processName} service`;
    service.state = random.choice(['RUNNING', 'STOPPED']);
    service.start_type = random.choice(['AUTO_START', 'DEMAND_START']);
    service.type = 'OWN_PROCESS';
    service.exit_code = random.int(0, 15);
    service.win32_exit_code = random.int(0, 15);
    service.address = random.choice(['localhost', 'remotehost']);
  } else {
    const processName = random.choice([
      'com.apple.safari',
      'com.apple.finder',
      'com.apple.Terminal',
    ]);
    const name =
      processName.split('.').pop().charAt(0).toUpperCase() +
      processName.split('.').pop().slice(1);
    const starts = {
      on_mount: random.choice([true, false]),
      on_path_modified: ['/usr/local', '/etc'],
      on_not_empty_directory: ['/var/log'],
    };

    service.id = processName;
    service.name = name;
    service.description = `${processName} service`;
    service.start_type = random.choice(['AUTO_START', 'DEMAND_START']);
    service.type = 'OWN_PROCESS';
    service.enabled = random.choice(['enabled', 'disabled']);
    service.restart = random.choice(['always', 'never', 'on-failure']);
    service.frequency = random.int(10, 3600);
    service.starts = starts;
    service.inetd_compatibility = random.choice([true, false]);
  }
  return service;
}

function generateRandomProcess(os, state) {
  let process = {
    user: {
      name: random.choice(['root', 'admin', 'user']),
    },
  };

  if (os === 'linux') {
    process.executable = random.choice([
      '/usr/bin/python3',
      '/usr/sbin/sshd',
      '/usr/sbin/nginx',
    ]);
  } else if (os === 'windows') {
    process.pid = state === 'RUNNING' ? random.int(100, 5000) : null;
    process.executable = random.choice([
      'C:\\Program Files\\App\\app.exe',
      'C:\\Windows\\System32\\svchost.exe',
    ]);
  } else {
    process.executable = random.choice([
      '/Applications/App.app/Contents/MacOS/App',
      '/usr/bin/terminal',
    ]);
    process.args = random.choice([['-l', '-a'], ['--options 123'], ['-v']]);
    process.group = {
      name: random.choice(['admin', 'staff', 'users']),
    };
    process.working_directory = `/home/${random.choice([
      'user1',
      'user2',
      'user3',
    ])}`;
    process.root_directory = `/home/${random.choice([
      'user1',
      'user2',
      'user3',
    ])}`;
  }

  return process;
}

function generateDocument(params) {
  let document = {};

  const os = random.choice(['linux', 'windows', 'mac']);
  if (os === 'linux') {
    document.file = {
      path: `/usr/lib/systemd/system/${random.choice([
        'nginx.service',
        'sshd.service',
        'cron.service',
      ])}`,
    };
  } else if (os === 'mac') {
    document.file = {
      path: `/Applications/${random.choice(['App.app', 'Service.app'])}`,
    };
    document.log = {
      file: {
        path: `/var/log/${random.choice([
          'App.error.log',
          'Service.error.log',
        ])}`,
      },
    };
    document.error = {
      log: {
        file: {
          path: `/var/log/${random.choice([
            'App.error.log',
            'Service.error.log',
          ])}`,
        },
      },
    };
  }

  document.service = generateRandomService(os);
  document.process = generateRandomProcess(os, document.service.state);
  document.agent = generateRandomAgent();
  document.wazuh = generateRandomWazuh(params);
  return document;
}

module.exports = {
  generateDocument,
};
