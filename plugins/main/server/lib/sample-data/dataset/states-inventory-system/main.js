const random = require('../../lib/random');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-system';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_agent() {
  return {
    id: String(random.int(0, 99)).padStart(3, '0'),
    name: `Agent${random.int(0, 99)}`,
    version: `v${random.int(0, 9)}-stable`,
    host: generate_random_host(false),
  };
}

function generate_random_host(is_root_level = false) {
  if (is_root_level) {
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
  } else {
    return {
      architecture: random.choice(['x86_64', 'arm64']),
      ip: random.ip(),
    };
  }
}

function generate_random_wazuh() {
  return {
    cluster: {
      name: `wazuh-cluster-${random.int(0, 10)}`,
      node: `wazuh-cluster-node-${random.int(0, 10)}`,
    },
    schema: { version: '1.7.0' },
  };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    '@timestamp': random.date(),
    agent: generate_random_agent(),
    host: generate_random_host(true),
    wazuh: generate_random_wazuh(),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document,
};
