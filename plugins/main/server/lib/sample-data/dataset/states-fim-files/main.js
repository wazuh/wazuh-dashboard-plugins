const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
  generateRandomChecksum,
} = require('../../shared-utils');
const {
  pathsLinux,
} = require('../../../generate-alerts/sample-data/integrity-monitoring');

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
