const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
} = require('../shared-utils');
const {
  pathsLinux,
} = require('../../../generate-alerts/sample-data/integrity-monitoring');

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

const permissionsChars = ['r', 'w', 'x'];
function generatePermissions() {
  return Array.from({ length: 9 })
    .map((_, index) => random.choice([permissionsChars[index % 3], '-']))
    .join('');
}

function generateRandomFile() {
  return {
    attributes: random.sample(
      ['hidden', 'read_only', 'system', 'archive', 'temporary'],
      random.int(1, 5),
    ),
    device: random.choice(['sda', 'sdb', 'sdc']),
    gid: `gid${random.int(0, 1000)}`,
    group: `group${random.int(0, 1000)}`,
    hash: {
      md5: `${random.int(0, 9999)}`,
      sha1: `${random.int(0, 9999)}`,
      sha256: `${random.int(0, 9999)}`,
    },
    inode: `inode${random.int(0, 1000)}`,
    mtime: random.date(),
    owner: `owner${random.int(0, 1000)}`,
    path: random.choice(pathsLinux),
    permissions: generatePermissions(),
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    checksum: generateRandomChecksum(),
    file: generateRandomFile(),
    state: generateRandomState(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
