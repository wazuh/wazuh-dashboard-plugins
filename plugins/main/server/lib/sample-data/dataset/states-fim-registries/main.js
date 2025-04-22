const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomDataStream() {
  return {
    type: random.choice(['Scheduled', 'Realtime']),
  };
}

function generateRandomEvent() {
  return {
    category: random.choice(['registy_value', 'registry_key', 'file']),
    type: random.choice(['added', 'modified', 'deleted']),
  };
}

function generateRandomRegistry() {
  return {
    data: {
      hash: {
        md5: `${random.int(0, 9999)}`,
        sha1: `${random.int(0, 9999)}`,
        sha256: `${random.int(0, 9999)}`,
      },
      type: random.choice(['REG_SZ', 'REG_DWORD']),
    },
    gid: `gid${random.int(0, 1000)}`,
    group: `group${random.int(0, 1000)}`,
    hive: 'HKLM',
    key: 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\winword.exe',
    mtime: random.unixTimestamp(),
    owner: `owner${random.int(0, 1000)}`,
    path: '/path/to/file',
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
    value: `registry_value${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generateRandomAgent(),
    data_stream: generateRandomDataStream(),
    event: generateRandomEvent(),
    registry: generateRandomRegistry(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
