const random = require('../lib/random');

/**
 * Generates a random host object
 * @returns {Object} Random host object
 */
function generateRandomHost() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    ip: random.ip(),
  };
}

/**
 * Generates a random agent object
 * @returns {Object} Random agent object
 */
function generateRandomAgent() {
  const agent = {
    id: String(random.int(0, 99)).padStart(3, '0'),
    name: `Agent${random.int(0, 99)}`,
    version: `v${random.int(0, 9)}-stable`,
    host: generateRandomHost(),
  };
  return agent;
}

/**
 * Generates a random wazuh object
 * @param {Object} params - Parameters that may contain cluster information
 * @returns {Object} Random wazuh object
 */
function generateRandomWazuh(params) {
  return {
    cluster: {
      name: params?.cluster?.name || `wazuh-cluster-${random.int(0, 10)}`,
      node: params?.cluster?.node || `wazuh-cluster-node-${random.int(0, 10)}`,
    },
    schema: { version: '1.7.0' },
  };
}

module.exports = {
  generateRandomAgent,
  generateRandomHost,
  generateRandomWazuh,
};
