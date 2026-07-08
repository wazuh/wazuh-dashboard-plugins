const fs = require('fs');
const path = require('path');
const random = require('./lib/random');
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
 * @returns {Object} Random host object following Wazuh ECS schema
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
 * @returns {Object} Random agent object following Wazuh ECS schema
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
 * Generates a random state object for Wazuh
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
/**
 * Generates a random checksum object
 * @returns {Object} Random checksum object with SHA1 hash
 */
function generateRandomChecksum() {
  const hexChars = 'ABCDEF0123456789';
  let sha1 = '';
  for (let i = 0; i < 40; i++) {
    sha1 += hexChars[random.int(0, hexChars.length - 1)];
  }
  return {
    hash: {
      sha1: sha1,
    },
  };
}
// ============================================================================
// Loader Functions - For pre-generated findings catalogued by module
// ============================================================================
/**
 * Parses the raw content of a sample-data file. Supports a single JSON value
 * (object or array) and NDJSON (one JSON object per line).
 * @param {string} content - Raw file content
 * @returns {Object[]} Array of parsed documents
 */
function parseContent(content) {
  const trimmed = content.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    // NDJSON: one JSON object per line
    return trimmed
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => JSON.parse(l));
  }
}
/**
 * Loads sample documents from a target path. The target may be either a single
 * .json/.ndjson file or a directory containing such files.
 * @param {string} target - Absolute path to a file or directory
 * @returns {Object[]} Flat array of parsed documents
 */
function loadDocs(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return parseContent(fs.readFileSync(target, 'utf8'));
  }
  const files = fs.readdirSync(target).filter(f => /\.(json|ndjson)$/.test(f));
  return files.flatMap(f =>
    parseContent(fs.readFileSync(path.join(target, f), 'utf8')),
  );
}
module.exports = {
  generateRandomAgent,
  generateRandomHost,
  generateRandomWazuh,
  generateRandomState,
  generateRandomChecksum,
  loadDocs,
};
