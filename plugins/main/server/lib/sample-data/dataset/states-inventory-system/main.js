const random = require('../../lib/random');
const {
  generateRandomWazuh,
  generateRandomAgent,
  generateRandomState,
  generateRandomChecksum,
} = require('../../shared-utils');

/**
 * Operating systems reported by the agents, following the `host.os` shape of the
 * system inventory. Only Windows fills `display_version` (`DisplayVersion` or
 * `ReleaseId` registry value). `full` is built by `getFullName`.
 */
/* eslint-disable camelcase -- the keys reproduce the index fields */
const OPERATING_SYSTEMS = [
  {
    type: 'linux',
    platform: 'ubuntu',
    name: 'Ubuntu',
    version: '22.04.3 LTS (Jammy Jellyfish)',
    kernel: '5.15.0-91-generic',
    major: '22',
    minor: '04',
    patch: '3',
    codename: 'jammy',
  },
  {
    type: 'linux',
    platform: 'ubuntu',
    name: 'Ubuntu',
    version: '24.04.1 LTS (Noble Numbat)',
    kernel: '6.8.0-45-generic',
    major: '24',
    minor: '04',
    patch: '1',
    codename: 'noble',
  },
  {
    type: 'linux',
    platform: 'debian',
    name: 'Debian GNU/Linux',
    version: '12 (bookworm)',
    kernel: '6.1.0-18-amd64',
    major: '12',
    minor: '7',
    codename: 'bookworm',
  },
  {
    type: 'linux',
    platform: 'rhel',
    name: 'Red Hat Enterprise Linux',
    version: '9.4 (Plow)',
    kernel: '5.14.0-427.13.1.el9_4.x86_64',
    major: '9',
    minor: '4',
    codename: 'Plow',
  },
  {
    type: 'macos',
    platform: 'darwin',
    name: 'macOS',
    version: '14.6.1',
    kernel: '23.6.0',
    major: '14',
    minor: '6',
    patch: '1',
    build: '23G93',
    codename: 'Sonoma',
  },
  {
    type: 'windows',
    platform: 'windows',
    name: 'Microsoft Windows 11 Pro',
    version: '10.0.22631.4169',
    kernel: '10.0.22631',
    major: '10',
    minor: '0',
    patch: '4169',
    build: '22631',
    display_version: '23H2',
  },
  {
    type: 'windows',
    platform: 'windows',
    name: 'Microsoft Windows 10 Enterprise',
    version: '10.0.19045.4894',
    kernel: '10.0.19045',
    major: '10',
    minor: '0',
    patch: '4894',
    build: '19045',
    display_version: '22H2',
  },
  {
    type: 'windows',
    platform: 'windows',
    name: 'Microsoft Windows Server 2019 Datacenter',
    version: '10.0.17763.6293',
    kernel: '10.0.17763',
    major: '10',
    minor: '0',
    patch: '6293',
    build: '17763',
    display_version: '1809',
  },
];
/* eslint-enable camelcase */

/**
 * Operating system name including the version, as each agent platform reports it:
 * the product name and display version on Windows, the `System Version` line of
 * `system_profiler` on macOS, and the name and version elsewhere.
 */
function getFullName(os) {
  switch (os.type) {
    case 'windows':
      return `${os.name} ${os.display_version}`;
    case 'macos':
      return `${os.name} ${os.version} (${os.build})`;
    default:
      return `${os.name} ${os.version}`;
  }
}

function generateRandomHostSystem() {
  const os = random.choice(OPERATING_SYSTEMS);
  return {
    architecture: random.choice(['x86_64', 'arm64']),
    hostname: `host${random.int(0, 1000)}`,
    os: {
      ...os,
      full: getFullName(os),
    },
  };
}

function generateDocument(params) {
  // https://github.com/wazuh/wazuh-indexer/pull/744
  return {
    checksum: generateRandomChecksum(),
    host: generateRandomHostSystem(),
    state: generateRandomState(),
    wazuh: {
      ...generateRandomWazuh(params),
      agent: generateRandomAgent(),
    },
  };
}

module.exports = {
  generateDocument,
};
