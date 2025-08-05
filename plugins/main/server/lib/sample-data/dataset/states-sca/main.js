const random = require('../../lib/random');
const { generateRandomAgent, generateRandomWazuh } = require('../shared-utils');

const scaResults = ['passed', 'failed', 'Not run'];

function word() {
  const words = ['network', 'smb', 'auth', 'firewall', 'admin', 'crypto'];
  return random.choice(words);
}

function sentence(wordsCount = 5) {
  return Array.from({ length: wordsCount }, () => word()).join(' ') + '.';
}

function generateDocument(params) {
  return {
    checksum: {
      hash: {
        sha1: random.hash(),
      },
    },
    agent: generateRandomAgent(),
    check: {
      compliance: [
        `int:${random.int(1, 5)}.${random.int(1, 5)}.${random.int(1, 5)}`,
      ],
      condition: random.choice(['all', 'any']),
      description: sentence(6),
      id: `CUST${random.int(100, 999)}`,
      name: `Ensure ${random.word()} is ${random.choice([
        'enabled',
        'disabled',
      ])}.`,
      rationale: `${sentence(6)}`,
      reason: null,
      references: [`https://internal.docs/policies/${random.word()}`],
      remediation: `Set registry key ${random.word()} to ${random.choice([
        '0',
        '1',
      ])}.`,
      result: random.choice(scaResults),
      rules: [
        `r:HKLM\\SYSTEM\\${random.word()}\\Parameters -> n:${random.word()} compare == ${random.choice(
          ['0', '1'],
        )}`,
      ],
    },
    policy: {
      description: `${sentence(8)}`,
      file: `${random.word()}_policy.yml`,
      id: `custom_policy_${random.word()}`,
      name: `Custom ${random.word()} Hardening Policy`,
      references: [`https://internal.docs/policies/${random.word()}`],
    },
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
