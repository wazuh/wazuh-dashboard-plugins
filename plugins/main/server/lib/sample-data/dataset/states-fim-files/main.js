const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomDate() {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() - 10);

  // Random date between start_date and end_date
  const randomDate = new Date(
    endDate.getTime() +
      Math.random() * (startDate.getTime() - endDate.getTime()),
  );

  // Format date to match the Python format
  return randomDate.toISOString();
}

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
    mtime: generateRandomDate(),
    owner: `owner${random.int(0, 1000)}`,
    path: '/path/to/file',
    size: random.int(1000, 1000000),
    uid: `uid${random.int(0, 1000)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': generateRandomDate(),
    agent: generateRandomAgent(),
    file: generateRandomFile(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
