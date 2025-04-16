const random = require('../../lib/random');
const {
  generate_random_agent,
  generate_random_wazuh,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-protocols';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_protocol() {
  return {
    description: `description${random.int(0, 9999)}`,
    gateway: random.ip(),
    name: `protocol${random.int(0, 9999)}`,
    remote_ip: random.ip(),
    status: random.choice(['Active', 'Inactive']),
    type: random.choice(['TCP', 'UDP', 'ICMP']),
  };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    protocol: generate_random_protocol(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
