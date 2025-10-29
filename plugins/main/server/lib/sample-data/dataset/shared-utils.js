const random = require('../lib/random');

// ============================================================================
// Constants - Realistic values for sample data generation
// ============================================================================

/**
 * Hostnames inspired by solar system planets for memorable sample data
 * Source: Aligned with wazuh-indexer-plugins generators
 */
const HOSTNAMES = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

/**
 * Operating system names - Specific distributions for realistic data
 */
const OS_NAMES = ['Ubuntu', 'Windows', 'macOS', 'Debian', 'CentOS', 'RHEL'];

/**
 * Operating system platforms - Matching OS names for consistency
 */
const OS_PLATFORMS = [
  'ubuntu',
  'windows',
  'darwin',
  'debian',
  'centos',
  'rhel',
];

/**
 * Operating system types - Common deployment types
 */
const OS_TYPES = ['linux', 'windows', 'macos', 'server'];

/**
 * Realistic OS versions mapped to common releases
 */
const OS_VERSIONS = ['22.04', '10.0.17763', '13.5', '11', '8', '9.0'];

/**
 * Agent groups - Infrastructure and environment based grouping
 */
const AGENT_GROUPS = [
  'default',
  'webservers',
  'database',
  'dmz',
  'production',
  'development',
];

/**
 * System architectures - Common CPU architectures
 */
const ARCHITECTURES = ['x86_64', 'arm64'];

// ============================================================================
// Generator Functions
// ============================================================================

/**
 * Generates a random host object with realistic values
 * @returns {Object} Random host object following Wazuh 5.0 ECS schema
 */
function generateRandomHost() {
  return {
    architecture: random.choice(ARCHITECTURES),
    hostname: random.choice(HOSTNAMES),
    ip: random.ip(),
    os: {
      name: random.choice(OS_NAMES),
      platform: random.choice(OS_PLATFORMS),
      type: random.choice(OS_TYPES),
      version: random.choice(OS_VERSIONS),
    },
  };
}

/**
 * Generates a random agent object with realistic values
 * @returns {Object} Random agent object following Wazuh 5.0 ECS schema
 */
function generateRandomAgent() {
  return {
    id: String(random.int(0, 99)).padStart(3, '0'),
    name: `Agent${random.int(0, 99)}`,
    version: `v${random.int(0, 9)}-stable`,
    groups: random.sample(AGENT_GROUPS, random.int(1, 3)),
    host: generateRandomHost(),
  };
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
