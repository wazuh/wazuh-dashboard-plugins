const random = require('../../lib/random');
const {
  generateRandomWazuh,
  generateRandomAgent,
  generateRandomState,
} = require('../../shared-utils');

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
    gid: `gid${random.int(0, 1000)}`,
    group: `group${random.int(0, 1000)}`,
    hive: 'HKLM',
    key: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\winword.exe',
    mtime: random.date(),
    owner: `owner${random.int(0, 1000)}`,
    path: `HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\winword.exe`,
    permissions: [
      '{"S-1-5-32-544":{"name":"Administrators","allowed":["delete","read_control","write_dac","write_owner","read_data","write_data","append_data","read_ea","write_ea","execute"]},"S-1-5-18":{"name":"SYSTEM","allowed":["delete","read_control","write_dac","write_owner","read_data","write_data","append_data","read_ea","write_ea","execute"]}}',
    ],
    uid: `uid${random.int(0, 1000)}`,
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
