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
  };
}

function generateRandomUser() {
  return {
    id: Random.createHash(10),
  };
}

function generateRandomExtension() {
  const extensionBase = random.choice(extensions);
  return {
    name: extensionBase.name,
    id: extensionBase.id,
    description: extensionBase.description,
    author: extensionBase.author,
    version: random.randomVersion(),
    sdk: random.choice(sdkTypes),
    path: `/Extensions/${extensionBase.name.toLowerCase().replace(/\s+/g, '')}`,
    profile: {
      name: random.choice(profiles),
      path: `/Profiles/${extensionBase.name.toLowerCase()}`,
    },
    update_address: `${random.choice(webstoreSources)}/update`,
    attributes:
      random.choice(attributesPool) + ',' + random.choice(attributesPool),
    source: {
      address: random.choice(webstoreSources),
    },
    type: 'extension',
    enabled: random.boolean(),
    autoupdate: random.boolean(),
    persistent: random.boolean(),
    from_webstore: random.boolean(),
    referenced: random.boolean(),
    installed: DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
    ),
    manifest: {
      hash: Random.createHash(10),
      json: '{}',
    },
    key: Random.createHash(10),
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    agent: generateRandomAgent(),
    browser: generateRandomBrowser(),
    user: generateRandomUser(),
    extension: generateRandomExtension(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
