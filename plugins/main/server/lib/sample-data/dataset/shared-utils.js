const random = require('../lib/random');

/**
 * Generates a random host object
 * @returns {Object} Random host object
 */
function generateRandomHost() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    hostname: `host-${random.int(1, 999)}.example.com`,
    ip: random.ip(),
    os: {
      name: random.choice([
        'Ubuntu',
        'Windows',
        'macOS',
        'Debian',
        'CentOS',
        'RHEL',
      ]),
      platform: random.choice([
        'ubuntu',
        'windows',
        'darwin',
        'debian',
        'centos',
        'rhel',
      ]),
      type: random.choice(['linux', 'windows', 'macos']),
      version: random.choice(['22.04', '10.0.17763', '13.5', '11', '8', '9.0']),
    },
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
    groups: random.sample(
      ['default', 'production', 'development', 'testing', 'dmz'],
      random.int(1, 3),
    ),
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
      name:
        params?.cluster?.name ||
        params?.manager?.name ||
        `wazuh-cluster-${random.int(0, 10)}`,
      node: params?.cluster?.node || `wazuh-cluster-node-${random.int(0, 10)}`,
    },
    schema: { version: '1.7.0' },
  };
}

/**
 * Generates a random state object for Wazuh 5.0
 * @returns {Object} Random state object
 */
function generateRandomState() {
  return {
    document_version: random.int(1, 10),
    modified_at: new Date(
      Date.now() - random.int(0, 7 * 24 * 60 * 60 * 1000),
    ).toISOString(),
  };
}

module.exports = {
  generateRandomAgent,
  generateRandomHost,
  generateRandomWazuh,
  generateRandomState,
};
