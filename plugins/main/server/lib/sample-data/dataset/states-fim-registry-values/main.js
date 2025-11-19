const random = require('../../lib/random');
const {
  generateRandomWazuh,
  generateRandomAgent,
  generateRandomState,
  generateRandomChecksum,
} = require('../../shared-utils');

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
    hive: 'HKLM',
    key: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\winword.exe',
    path: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\winword.exe',
    size: random.int(1000, 1000000),
    value: `registry_value${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  // https://github.com/wazuh/wazuh-indexer-plugins/issues/506
  return {
    agent: generateRandomAgent(),
    checksum: generateRandomChecksum(),
    registry: generateRandomRegistry(),
    state: generateRandomState(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
