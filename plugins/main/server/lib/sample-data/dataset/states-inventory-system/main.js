const random = require('../../lib/random');
const {
  generate_random_wazuh,
  generate_random_agent,
} = require('../shared-utils');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-system';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_host_system() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    hostname: `host${random.int(0, 1000)}`,
    os: {
      build: `${random.int(0, 1000)}`,
      codename: random.choice(['Jammy', 'Noble', 'Ventura']),
      distribution: {
        release: `${random.int(1, 20)}.${random.int(1, 100)}`,
      },
      full: `${random.choice(['debian', 'ubuntu', 'macos', 'ios', 'android', 'RHEL'])} ${random.int(0, 99)}.${random.int(0, 99)}`,
      kernel: {
        name: random.choice(['Linux', 'Darwin', 'NT']),
        release: `${random.int(1, 1000)}`,
        version: `${random.int(1, 1000)}`,
      },
      major: `${random.int(1, 100)}`,
      minor: `${random.int(1, 100)}`,
      name: random.choice(['Linux', 'Windows', 'macOS']),
      patch: `${random.int(1, 100)}`,
      platform: random.choice(['platform1', 'platform2']),
      version: `${random.int(0, 9)}.${random.int(0, 9)}.${random.int(0, 9)}`,
    },
  };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    host: generate_random_host_system(),
    wazuh: generate_random_wazuh(params),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
