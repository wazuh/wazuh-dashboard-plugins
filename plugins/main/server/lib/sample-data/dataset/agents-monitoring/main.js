const {
  DateFormatter,
} = require('../../../generate-alerts/helpers/date-formatter');
const { Random } = require('../../../generate-alerts/helpers/random');
const random = require('../../lib/random');
const { version: packageVersion } = require('../../../../../package.json');

function generateDocument(params) {
  // Based on 4.x data from server API
  return {
    os: {
      build: '26100.3775',
      major: '10',
      minor: '0',
      name: 'Microsoft Windows 11 Pro',
      platform: 'windows',
      uname: 'Microsoft Windows 11 Pro',
      version: '10.0.26100.3775',
    },
    version: `Wazuh v${packageVersion}`,
    group: ['default'],
    group_config_status: 'synced',
    manager: `server${random.int(0, 1000)}`,
    ip: '192.168.1.140',
    id: '001',
    node_name: 'node01',
    name: `agent${random.int(0, 1000)}`,
    lastKeepAlive: '2025-04-14T17:25:03+00:00',
    mergedSum: 'cb5dc59d195320bb20b6039a519a8c0e',
    status_code: 0,
    configSum: 'ab73af41699f13fdd81903b5f23d8d00',
    dateAdd: '2025-04-14T17:21:48+00:00',
    status: random.choice([
      'active',
      'disconnected',
      'pending',
      'never_connected',
    ]),
    registerIP: 'any',
    timestamp: DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
    ),
    host: `host${random.int(0, 1000)}`,
    cluster: {
      name: params?.cluster?.name || 'disabled',
    },
  };
}

module.exports = {
  generateDocument,
};
