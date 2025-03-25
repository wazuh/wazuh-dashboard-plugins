const random = require('../../lib/random');

const default_count = '10000';
const default_index_name_prefix = 'wazuh-states-inventory-ports';
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
      network: {
        egress: { queue: random.int(0, 1000) },
        ingress: { queue: random.int(0, 1000) },
      }
    };
  } else {
    return {
      architecture: random.choice(["x86_64", "arm64"]),
      ip: random.ip(),
    };
  }
}

function generate_random_destination() {
  return {
    ip: random.ip(),
    port: random.int(0, 65535),
  };
}

function generate_random_file() {
  return { inode: `inode${random.int(0, 9999)}` };
}

function generate_random_process() {
  return {
    name: `process${random.int(0, 9999)}`,
    pid: random.int(0, 99999),
  };
}

function generate_random_source() {
  return {
    ip: random.ip(),
    port: random.int(0, 65535),
  };
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
    destination: generate_random_destination(),
    file: generate_random_file(),
    host: generate_random_host(true),
    interface: { state: random.choice(["LISTEN", "ESTABLISHED"]) },
    network: { transport: random.choice(["TCP", "UDP", "ICMP"]) },
    process: generate_random_process(),
    source: generate_random_source(),
    wazuh: generate_random_wazuh(),
  };
}

module.exports = {
  default_count,
  default_index_name,
  generate_document
};