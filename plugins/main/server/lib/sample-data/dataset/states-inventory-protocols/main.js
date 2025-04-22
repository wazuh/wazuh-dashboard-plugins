const random = require('../../lib/random');
const {
  generate_random_agent,
  generate_random_wazuh,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-protocols';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_network() {
  return {
    dhcp: random.boolean(),
    gateway: random.ip(),
    metric: random.int(0, 1000),
    type: random.choice(['Ethernet', 'WiFi', 'VPN', 'Bluetooth', 'Cellular'])
  };
}

function generate_random_observer() {
  return {
    ingress: {
      interface: {
        name: `interface${random.int(0, 100)}`
      }
    }
  };
}

function generate_document(params) {
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    network: generate_random_network(),
    observer: generate_random_observer(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
