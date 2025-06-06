const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomSerialNumber() {
  return `serial${random.int(0, 9999)}`;
}

function generateRandomHostHardware() {
  return {
    serial_number: generateRandomSerialNumber(),
    cpu: {
      cores: random.int(1, 16),
      name: `CPU${random.int(1, 999)}`,
      speed: random.int(1000, 5000),
    },
    memory: {
      free: random.int(1000, 100000),
      total: random.int(1000, 100000),
      used: random.int(0, 100),
      used_percentage: random.float(0, 1),
    },
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    host: generateRandomHostHardware(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
