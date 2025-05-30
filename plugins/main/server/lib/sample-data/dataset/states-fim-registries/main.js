const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomEvent() {
  return {
    category: random.choice(['registry_value', 'registry_key', 'file']),
    action: random.choice(['added', 'modified', 'deleted']),
  };
}

function generateRandomRegistry() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
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
    mtime: random.date(),
    owner: `owner${random.int(0, 1000)}`,
    path: `/path/to/file_${random.int(0, 20)}`,
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
    value: `registry_value${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    event: generateRandomEvent(),
    registry: generateRandomRegistry(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
