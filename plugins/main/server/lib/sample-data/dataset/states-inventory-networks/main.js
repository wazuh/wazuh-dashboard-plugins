const random = require('../../lib/random');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-networks';
const default_index_name = `${default_index_name_prefix}-sample`;

function generate_random_agent() {
  return {
    id: String(random.int(0, 99)).padStart(3, '0'),
    name: `Agent${random.int(0, 99)}`,
    version: `v${random.int(0, 9)}-stable`,
    host: generate_random_host(false),
  };
}

function generate_random_host(is_root_level_level = false) {
  if (is_root_level_level) {
    return {
      ip: random.ip()
    };
  } else {
    return {
      architecture: random.choice(["x86_64", "arm64"]),
      ip: random.ip(),
    };
  }
}

function generate_random_network() {
  return {
    broadcast: random.ip(),
    dhcp: random.boolean(),
    ip: random.ip(),
    metric: random.int(1, 100),
    name: generate_random_interface(),
    netmask: random.ip(),
    protocol: random.choice(["TCP", "UDP", "ICMP"]),
  };
}

function generate_random_interface() {
  return `name${random.int(0, 9999)}`;
}

function generate_random_wazuh() {
  return {
    cluster: {
      name: `wazuh-cluster-${random.int(0, 10)}`,
      node: `wazuh-cluster-node-${random.int(0, 10)}`,
    },
    schema: { version: "1.7.0" },
  };
}

function generate_document(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    "@timestamp": random.date(),
    agent: generate_random_agent(),
    network: generate_random_network(),
    wazuh: generate_random_wazuh()
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document
};