const random = require('../../lib/random');
const {
  generate_random_agent,
  generate_random_wazuh,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-packages';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_package() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    description: `description${random.int(0, 9999)}`,
    category: random.choice(['x11', 'libs', 'ssh']),
    installed: random.date(),
    name: `package${random.int(0, 9999)}`,
    path: `/path/to/package${random.int(0, 9999)}`,
    vendor: random.choice(['Microsoft', 'Canonical', 'Apple', 'RedHat']),
    version: `${random.int(0, 9)}.${random.int(0, 9)}.${random.int(0, 9)}`,
  };
}

function generate_document(params) {
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    package: generate_random_package(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
