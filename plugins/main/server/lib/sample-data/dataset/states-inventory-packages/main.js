const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

function generateRandomPackage() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    description: `description${random.int(0, 9999)}`,
    category: random.choice(['x11', 'libs', 'ssh']),
    installed: random.date(),
    multiarch: random.choice(['yes', 'no']),
    name: `package${random.int(0, 9999)}`,
    path: `/path/to/package${random.int(0, 9999)}`,
    priority: random.choice(['high', 'medium', 'low']),
    size: random.int(0, 9999),
    source: random.choice(['updates', 'security']),
    type: random.choice(['rpm', 'deb', 'apk']),
    vendor: random.choice(['Microsoft', 'Canonical', 'Apple', 'RedHat']),
    version: `${random.int(0, 9)}.${random.int(0, 9)}.${random.int(0, 9)}`,
  };
}

function generateDocument(params) {
  return {
    agent: generateRandomAgent(),
    package: generateRandomPackage(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
