const random = require('../../lib/random');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-interfaces';
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
      mac: random.macAddress()
    };
  } else {
    return {
      architecture: random.choice(["x86_64", "arm64"]),
      ip: random.ip(),
    };
  }
}

function generate_random_interface(is_root_level = false) {
  return {
    alias: `alias${random.int(0, 9999)}`,
    mtu: `${random.int(1000000, 99999999)}`,
    name: `name${random.int(0, 9999)}`,
    state: random.choice(["Active", "Inactive", "Unknown"]),
    type: random.choice(["wireless", "ethernet"]),
  };
}

function generate_random_observer() {
  return { ingress: { interface: generate_random_interface(false) } };
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
    host: generate_random_host(true),
    observer: generate_random_observer(),
    wazuh: generate_random_wazuh(),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document
};