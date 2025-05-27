const random = require('../../lib/random');

function generateRandomHost() {
  return {
    os: {
      full: `full${random.int(0, 10000)}`,
      kernel: `kernel${random.int(0, 10000)}`,
      name: `name${random.int(0, 10000)}`,
      platform: `platform${random.int(0, 10000)}`,
      type: `type${random.int(0, 10000)}`,
      version: `version${random.int(0, 10000)}`,
    },
  };
}

function generateRandomAgent() {
  return {
    build: {
      original: `original${random.int(0, 10000)}`,
    },
    ephemeral_id: `ephemeral_id${random.int(0, 10000)}`,
    id: `00${random.int(0, 99) + 1}`,
    name: `Agent${random.int(0, 100)}`,
    type: ['filebeat', 'windows', 'linux', 'macos'][random.int(0, 4)],
    version: `1.${random.int(0, 10)}.${random.int(0, 10)}`,
  };
}

function generateRandomPackage() {
  const types = [
    'deb',
    'rpm',
    'msi',
    'pkg',
    'app',
    'apk',
    'exe',
    'zip',
    'tar',
    'gz',
    '7z',
    'rar',
    'cab',
    'iso',
    'dmg',
    'tar.gz',
    'tar.bz2',
    'tar.xz',
    'tar.Z',
    'tar.lz4',
    'tar.sz',
    'tar.zst',
  ];

  return {
    architecture: ['x86', 'x64', 'arm', 'arm64'][random.int(0, 4)],
    build_version: `build${random.int(0, 10000)}`,
    checksum: `checksum${random.int(0, 10000)}`,
    description: `description${random.int(0, 10000)}`,
    install_scope: ['user', 'system'][random.int(0, 2)],
    installed: random.date(),
    license: `license${random.int(0, 10)}`,
    name: `name${random.int(0, 100)}`,
    path: `/path/to/package${random.int(0, 100)}`,
    reference: `package-reference-${random.int(0, 100)}`,
    size: random.int(0, 100000),
    type: types[random.int(0, 22)],
    version: `v${random.int(0, 10)}-stable`,
  };
}

function generateRandomReference(vulnerabilityID) {
  const reference = `https://mycve.test.org/cgi-bin/cvename.cgi?name=${vulnerabilityID}`;
  if (Math.random() < 0.5) {
    return `${reference}, ${reference}`;
  } else {
    return reference;
  }
}

function generateRandomVulnerability() {
  return {
    category: ['security', 'config', 'os', 'package', 'custom'][
      random.int(0, 5)
    ],
    classification: `classification${random.int(0, 10000)}`,
    description: `description${random.int(0, 10000)}`,
    detected_at: random.date(),
    enumeration: 'CVE',
    id: `CVE-${random.int(0, 10000)}`,
    published_at: random.date(),
    reference: generateRandomReference(`CVE-${random.int(0, 10000)}`),
    report_id: `report-${random.int(0, 10000)}`,
    scanner: {
      condition: `condition${random.int(0, 10000)}`,
      source: `source${random.int(0, 10000)}`,
      vendor: `vendor-${random.int(0, 10)}`,
      reference: `https://cti.wazuh.com/vulnerabilities/cves/CVE-${random.int(
        1,
        10000,
      )}`,
    },
    score: {
      base: random.int(0, 10),
      environmental: random.int(0, 10),
      temporal: random.int(0, 10),
      version: `${random.int(0, 10)}`,
    },
    severity: ['Low', 'Medium', 'High', 'Critical'][random.int(0, 4)],
    under_evaluation: Math.random() < 0.5,
  };
}

function generateRandomWazuh() {
  const clusterNames = ['wazuh.manager', 'wazuh'];
  const nodeTypes = ['master', 'worker-01', 'worker-02', 'worker-03'];

  return {
    cluster: {
      name: clusterNames[random.int(0, clusterNames.length)],
      node: nodeTypes[random.int(0, nodeTypes.length)],
    },
    schema: {
      version: `1.${random.int(0, 10)}.${random.int(0, 10)}`,
    },
  };
}

function generateDocument() {
  return {
    agent: generateRandomAgent(),
    host: generateRandomHost(),
    package: generateRandomPackage(),
    vulnerability: generateRandomVulnerability(),
    wazuh: generateRandomWazuh(),
  };
}

module.exports = {
  generateDocument,
};
