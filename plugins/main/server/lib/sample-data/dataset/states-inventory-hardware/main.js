const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomHostHardware() {
  return {
    cpu: {
      cores: random.int(1, 16),
      name: `CPU${random.int(1, 999)}`,
      speed: random.int(1000, 5000),
    },
    memory: {
      free: random.int(1000, 100000),
      total: random.int(1000, 100000),
      used: random.int(0, 100),
    },
  };
}

function generateRandomObserver() {
  return { serial_number: `serial${random.int(0, 9999)}` };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generateRandomAgent(),
    host: generateRandomHostHardware(),
    observer: generateRandomObserver(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
