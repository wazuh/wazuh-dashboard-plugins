const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');
const {
  pathsLinux,
} = require('../../../generate-alerts/sample-data/integrity-monitoring');

function generateRandomFile() {
  return {
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
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    file: generateRandomFile(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
