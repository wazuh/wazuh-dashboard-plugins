const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomNetwork() {
  return {
    broadcast: random.ip(),
    dhcp: random.boolean(),
    ip: random.ip(),
    metric: random.int(1, 100),
    netmask: random.ip(),
    protocol: random.choice(['TCP', 'UDP', 'ICMP']),
  };
}

function generateRandomInterface() {
  return {
    name: `name${random.int(0, 9999)}`,
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generateRandomAgent(),
    network: generateRandomNetwork(),
    interface: generateRandomInterface(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
