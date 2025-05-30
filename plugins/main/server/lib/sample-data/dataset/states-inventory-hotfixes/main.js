const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomPackage() {
  return {
    hotfix: {
      name: `hotfix${random.int(0, 9999)}`,
    },
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    package: generateRandomPackage(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
