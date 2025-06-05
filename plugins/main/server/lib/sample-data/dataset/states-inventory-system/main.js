const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');

function generateRandomHostSystem() {
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    hostname: `host${random.int(0, 1000)}`,
    os: {
      build: `${random.int(0, 1000)}`,
      codename: random.choice(['Jammy', 'Noble', 'Ventura']),
      distribution: {
        release: `${random.int(1, 20)}.${random.int(1, 100)}`,
      },
      full: `${random.choice([
        'debian',
        'ubuntu',
        'macos',
        'ios',
        'android',
        'RHEL',
      ])} ${random.int(0, 99)}.${random.int(0, 99)}`,
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
      type: random.choice(['desktop', 'server']),
      version: `${random.int(0, 9)}.${random.int(0, 9)}.${random.int(0, 9)}`,
    },
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    host: generateRandomHostSystem(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
