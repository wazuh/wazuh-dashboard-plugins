const {
  CheckResult,
} = require('../../../../../public/components/overview/sca/utils/constants');
const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
} = require('../shared-utils');

const scaResults = [
  CheckResult.Passed,
  CheckResult.Failed,
  CheckResult.NotRun,
  CheckResult.NotApplicable,
];

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
      name: `Ensure ${word()} is ${random.choice(['enabled', 'disabled'])}.`,
      rationale: `${sentence(6)}`,
      reason: null,
      references: [`https://internal.docs/policies/${word()}`],
      remediation: `Set registry key ${word()} to ${random.choice([
        '0',
        '1',
      ])}.`,
      result: random.choice(scaResults),
      rules: [
        `r:HKLM\\SYSTEM\\${word()}\\Parameters -> n:${word()} compare == ${random.choice(
          ['0', '1'],
        )}`,
      ],
    },
    policy: {
      description: `${sentence(8)}`,
      file: `${word()}_policy.yml`,
      id: `custom_policy_${word()}`,
      name: `Custom ${word()} Hardening Policy`,
      references: [`https://internal.docs/policies/${word()}`],
    },
    state: generateRandomState(),
    wazuh: generateRandomWazuh(params),
  };
}

module.exports = {
  generateDocument,
};
