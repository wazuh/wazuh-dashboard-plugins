const random = require('../../lib/random');
const {
  generate_random_wazuh,
  generate_random_agent,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-interfaces';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_host_interfaces() {
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

function generate_random_interface(is_root_level = false) {
  return {
    alias: `alias${random.int(0, 9999)}`,
    mtu: `${random.int(1000000, 99999999)}`,
    name: `name${random.int(0, 9999)}`,
    state: random.choice(['Active', 'Inactive', 'Unknown']),
    type: random.choice(['wireless', 'ethernet']),
  };
}

function generate_random_observer() {
  return { ingress: { interface: generate_random_interface(false) } };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    host: generate_random_host_interfaces(),
    observer: generate_random_observer(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
