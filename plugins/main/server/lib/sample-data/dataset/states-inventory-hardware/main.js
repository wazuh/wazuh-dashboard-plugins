const random = require('../../lib/random');
const {
  generate_random_agent,
  generate_random_wazuh,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-hardware';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_host_hardware() {
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

function generate_random_observer() {
  return { serial_number: `serial${random.int(0, 9999)}` };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    host: generate_random_host_hardware(),
    observer: generate_random_observer(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
