const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomNetwork() {
  return {
    dhcp: random.boolean(),
    gateway: random.ip(),
    metric: random.int(0, 1000),
    type: random.choice(['Ethernet', 'WiFi', 'VPN', 'Bluetooth', 'Cellular']),
  };
}

function generateRandomObserver() {
  return {
    ingress: {
      interface: {
        name: `interface${random.int(0, 100)}`,
      },
    },
  };
}

function generateDocument(params) {
  return {
    agent: generateRandomAgent(),
    network: generateRandomNetwork(),
    observer: generateRandomObserver(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
