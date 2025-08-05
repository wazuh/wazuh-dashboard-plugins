const random = require('../../lib/random');
const { generateRandomWazuh, generateRandomAgent } = require('../shared-utils');
const { Random } = require('../../../generate-alerts/helpers/random');
const {
  DateFormatter,
} = require('../../../generate-alerts/helpers/date-formatter');

const browsers = ['Chrome', 'Firefox', 'Safari', 'internet Explorer'];
const extensions = [
  {
    name: 'AdBlock Plus',
    id: 'adblockplus@mozilla.org',
    description: 'Efficient ad blocker for faster browsing',
    author: 'Eyeo GmbH',
  },
  {
    name: 'Grammarly for Chrome',
    id: 'kbfnbcaeplbcioakkpcpgfkobkghlhen',
    description: 'Writing assistant to improve grammar and style',
    author: 'Grammarly, Inc.',
  },
  {
    name: 'Dark Reader',
    id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
    description: 'Dark mode for all websites',
    author: 'Alexander Shutov',
  },
  {
    name: 'Honey',
    id: 'bmnlcjabgnpnenekpadlanbbkooimhnj',
    description: 'Automatically finds and applies coupons when you shop online',
    author: 'Honey Science LLC',
  },
  {
    name: 'LastPass',
    id: 'hdokiejnpimakedhajhdlcegeplioahd',
    description: 'Secure and easy-to-use password manager',
    author: 'LastPass',
  },
  {
    name: 'Bitwarden',
    id: 'nngceckbapebfimnlniiiahkandclblb',
    description: 'Open-source password manager',
    author: 'Bitwarden Inc.',
  },
  {
    name: 'uBlock Origin',
    id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    description: 'Efficient content blocker',
    author: 'Raymond Hill',
  },
];
const attributesPool = [
  'privacy',
  'performance',
  'shopping',
  'security',
  'opensource',
  'appearance',
  'accessibility',
  'writing',
];
const sdkTypes = ['webextensions', 'legacy', 'manifest_v3'];
const profiles = ['Default', 'Security', 'Shopping', 'Profile 1', 'Work'];
const webstoreSources = [
  'https://chrome.google.com/webstore',
  'https://addons.mozilla.org',
  'https://webstore.fakeextensions.net',
];

function generateRandomBrowser() {
  return {
    name: random.choice(browsers),
    profile: {
      name: random.choice(profiles),
      path: `/Profiles/${random
        .choice(profiles)
        .toLowerCase()
        .replace(/\s+/g, '')}`,
    },
    referenced: random.boolean(),
  };
}

function generateRandomUser() {
  return {
    id: Random.createHash(10),
  };
}

function generateRandomPackage() {
  const packageBase = random.choice(extensions);
  return {
    autoupdate: random.boolean(),
    build_version: random.randomVersion(),
    description: packageBase.description,
    enabled: random.boolean(),
    from_webstore: random.boolean(),
    id: packageBase.id,
    installed: DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
    ),
    name: packageBase.name,
    path: `/Extensions/${packageBase.name.toLowerCase().replace(/\s+/g, '')}`,
    permissions: random
      .sample(attributesPool, random.integer(1, attributesPool.length))
      .join(','),
    persistent: random.boolean(),
    reference: packageBase.id,
    type: 'extension',
    vendor: packageBase.author,
    version: random.randomVersion(),
  };
}

function generateRandomFile() {
  return {
    hash: {
      sha256: Random.createHash(10) + '.sha256',
    },
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    browser: generateRandomBrowser(),
    file: generateRandomFile(),
    user: generateRandomUser(),
    package: generateRandomPackage(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
