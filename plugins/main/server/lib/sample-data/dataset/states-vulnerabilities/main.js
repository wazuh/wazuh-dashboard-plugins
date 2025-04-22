const random = require('../../lib/random');

function generateRandomHost() {
  return {
    architecture: ['x86', 'x64', 'arm', 'arm64'][Math.floor(Math.random() * 4)],
    boot: {
      id: random.int(0, 1000),
    },
    cpu: {
      usage: random.int(0, 100),
    },
    disk: {
      read: {
        bytes: random.int(0, 1000000),
      },
      write: {
        bytes: random.int(0, 1000000),
      },
    },
    domain: `domain${Math.floor(Math.random() * 10000)}`,
    geo: {
      city_name: `city${Math.floor(Math.random() * 10000)}`,
      continent_code: `continent${Math.floor(Math.random() * 10000)}`,
      continent_name: `continent${Math.floor(Math.random() * 10000)}`,
      country_iso_code: `country${Math.floor(Math.random() * 10000)}`,
      country_name: `country${Math.floor(Math.random() * 10000)}`,
      location: {
        lat: random.float(0, 90),
        lon: random.float(0, 180),
      },
      name: `name${Math.floor(Math.random() * 10000)}`,
      postal_code: `postal${Math.floor(Math.random() * 10000)}`,
      region_iso_code: `region${Math.floor(Math.random() * 10000)}`,
      region_name: `region${Math.floor(Math.random() * 10000)}`,
      timezone: `timezone${Math.floor(Math.random() * 10000)}`,
    },
    hostname: `hostname${Math.floor(Math.random() * 10000)}`,
    id: `00${Math.floor(Math.random() * 99) + 1}`,
    ip: random.ip(),
    mac: random.macAddress(),
    name: `name${Math.floor(Math.random() * 10000)}`,
    network: {
      egress: {
        bytes: random.int(0, 1000000),
        packets: random.int(0, 10000),
      },
      ingress: {
        bytes: random.int(0, 1000000),
        packets: random.int(0, 10000),
      },
    },
    os: {
      family: `family${Math.floor(Math.random() * 10000)}`,
      full: `full${Math.floor(Math.random() * 10000)}`,
      kernel: `kernel${Math.floor(Math.random() * 10000)}`,
      name: `name${Math.floor(Math.random() * 10000)}`,
      platform: `platform${Math.floor(Math.random() * 10000)}`,
      type: `type${Math.floor(Math.random() * 10000)}`,
      version: `version${Math.floor(Math.random() * 10000)}`,
    },
    pid_ns_ino: `pid_ns_ino${random.int(0, 1000000)}`,
    risk: {
      calculated_level: `calculated_level${Math.floor(Math.random() * 10000)}`,
      calculated_score: Math.floor(Math.random() * 10000),
      calculated_score_norm: Math.floor(Math.random() * 10000),
      static_level: `static_level${Math.floor(Math.random() * 10000)}`,
      static_score: Math.floor(Math.random() * 10000),
      static_score_norm: Math.floor(Math.random() * 10000),
    },
    type: ['filebeat', 'windows', 'linux', 'macos'][
      Math.floor(Math.random() * 4)
    ],
    uptime: random.int(0, 100), // Changed from object to direct integer
  };
}

function generateRandomAgent() {
  return {
    groups: ['group1', 'group2'],
    host: generateRandomHost(),
    id: `00${Math.floor(Math.random() * 99) + 1}`,
    name: `Agent${Math.floor(Math.random() * 100)}`,
    type: ['filebeat', 'windows', 'linux', 'macos'][
      Math.floor(Math.random() * 4)
    ],
    version: `1.${Math.floor(Math.random() * 10)}.${Math.floor(
      Math.random() * 10,
    )}`,
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
    architecture: ['x86', 'x64', 'arm', 'arm64'][Math.floor(Math.random() * 4)],
    build_version: `build${Math.floor(Math.random() * 10000)}`,
    checksum: `checksum${Math.floor(Math.random() * 10000)}`,
    description: `description${Math.floor(Math.random() * 10000)}`,
    install_scope: ['user', 'system'][Math.floor(Math.random() * 2)],
    installed: random.date(),
    license: `license${Math.floor(Math.random() * 10)}`,
    name: `name${Math.floor(Math.random() * 100)}`,
    path: `/path/to/package${Math.floor(Math.random() * 100)}`,
    reference: `package-reference-${Math.floor(Math.random() * 100)}`,
    size: Math.floor(Math.random() * 100000),
    type: types[Math.floor(Math.random() * 22)],
    version: `v${Math.floor(Math.random() * 10)}-stable`,
  };
}

function generateRandomTags() {
  const tags = [];
  const numTags = Math.floor(Math.random() * 10);

  for (let i = 0; i < numTags; i++) {
    let newTag = `tag${Math.floor(Math.random() * 100)}`;

    while (tags.includes(newTag)) {
      newTag = `tag${Math.floor(Math.random() * 100)}`;
    }

    tags.push(`tag${Math.floor(Math.random() * 100)}`);
  }

  return tags;
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
      Math.floor(Math.random() * 5)
    ],
    classification: `classification${Math.floor(Math.random() * 10000)}`,
    description: `description${Math.floor(Math.random() * 10000)}`,
    detected_at: random.date(),
    enumeration: 'CVE',
    id: `CVE-${Math.floor(Math.random() * 10000)}`,
    published_at: random.date(),
    reference: generateRandomReference(
      `CVE-${Math.floor(Math.random() * 10000)}`,
    ),
    report_id: `report-${Math.floor(Math.random() * 10000)}`,
    scanner: {
      condition: `condition${Math.floor(Math.random() * 10000)}`,
      source: `source${Math.floor(Math.random() * 10000)}`,
      vendor: `vendor-${Math.floor(Math.random() * 10)}`,
      reference: `https://cti.wazuh.com/vulnerabilities/cves/CVE-${Math.floor(
        Math.random() * 10000,
      )}`,
    },
    score: {
      base: Math.round(Math.random() * 10 * 10) / 10,
      environmental: Math.round(Math.random() * 10 * 10) / 10,
      temporal: Math.round(Math.random() * 10 * 10) / 10,
      version: `${Math.round(Math.random() * 10 * 10) / 10}`,
    },
    severity: ['Low', 'Medium', 'High', 'Critical'][
      Math.floor(Math.random() * 4)
    ],
    under_evaluation: Math.random() < 0.5,
  };
}

function generateRandomWazuh() {
  const clusterNames = ['wazuh.manager', 'wazuh'];
  const nodeTypes = ['master', 'worker-01', 'worker-02', 'worker-03'];

  return {
    cluster: {
      name: clusterNames[Math.floor(Math.random() * clusterNames.length)],
      node: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
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
