const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomInterface() {
  return `name${random.int(0, 9999)}`;
}

function generateRandomNetwork() {
  return {
    broadcast: random.ip(),
    dhcp: random.boolean(),
    ip: random.ip(),
    metric: random.int(1, 100),
    name: generateRandomInterface(),
    netmask: random.ip(),
    protocol: random.choice(['TCP', 'UDP', 'ICMP']),
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generateRandomAgent(),
    network: generateRandomNetwork(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
