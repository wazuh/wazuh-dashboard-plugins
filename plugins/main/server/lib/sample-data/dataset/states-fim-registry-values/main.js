const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomChecksum() {
  return {
    hash: {
      sha1: random.choice([
        '6853b29eef33ff39d8b63911673cf7b078f95485',
        'c3499c2729730a7f807efb8676a92dcb6f8a3f8f',
        'a80ed2ef79e22f1d8af817cea1dbbf01bef516cc',
        '272ae13f02a9c805923917a42d2f27bd02654dec',
      ]),
    },
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
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
