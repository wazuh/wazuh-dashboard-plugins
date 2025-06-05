const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomHostPorts() {
  return {
    network: {
      egress: { queue: random.int(0, 1000) },
      ingress: { queue: random.int(0, 1000) },
    },
  };
}

function generateRandomDestination() {
  return {
    ip: random.ip(),
    port: random.int(0, 65535),
  };
}

function generateRandomFile() {
  return { inode: `inode${random.int(0, 9999)}` };
}

function generateRandomProcess() {
  return {
    name: `process${random.int(0, 9999)}`,
    pid: random.int(0, 99999),
  };
}

function generateRandomSource() {
  return {
    ip: random.ip(),
    port: random.int(0, 65535),
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    destination: generateRandomDestination(),
    file: generateRandomFile(),
    host: generateRandomHostPorts(),
    interface: { state: random.choice(['LISTEN', 'ESTABLISHED']) },
    network: { transport: random.choice(['TCP', 'UDP', 'ICMP']) },
    process: generateRandomProcess(),
    source: generateRandomSource(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
