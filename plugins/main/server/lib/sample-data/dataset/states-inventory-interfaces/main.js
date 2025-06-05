const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomHostInterfaces() {
  return {
    network: {
      egress: {
        bytes: random.int(1000, 1000000),
        drops: random.int(0, 100),
        errors: random.int(0, 100),
        packets: random.int(100, 10000),
      },
      ingress: {
        bytes: random.int(1000, 1000000),
        drops: random.int(0, 100),
        errors: random.int(0, 100),
        packets: random.int(100, 10000),
      },
    },
    mac: random.macAddress(),
  };
}

function generateRandomInterface() {
  return {
    alias: `alias${random.int(0, 9999)}`,
    mtu: `${random.int(1000000, 99999999)}`,
    name: `name${random.int(0, 9999)}`,
    state: random.choice(['Active', 'Inactive', 'Unknown']),
    type: random.choice(['wireless', 'ethernet']),
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    host: generateRandomHostInterfaces(),
    interface: generateRandomInterface(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
