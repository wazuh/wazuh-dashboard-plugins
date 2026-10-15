const {
  CheckResult,
} = require('../../../../../public/components/overview/sca/utils/constants');
const random = require('../../lib/random');
const { REMEDIATION_VARIANTS } = require('./remediations');
const {
  generateRandomAgent,
  generateRandomWazuh,
  generateRandomState,
} = require('../../shared-utils');

const scaResults = [
  CheckResult.Passed,
  CheckResult.Failed,
  CheckResult.NotApplicable,
];

function word() {
  const words = ['network', 'smb', 'auth', 'firewall', 'admin', 'crypto'];
  return random.choice(words);
}

function sentence(wordsCount = 5) {
  return Array.from({ length: wordsCount }, () => word()).join(' ') + '.';
}

// Same shape as the real documents: one array of requirement ids per mapped framework.
// The keys are the field names of the index, so they can't be camelCase.
/* eslint-disable camelcase */
function generateCompliance() {
  return {
    pci_dss: [`${random.int(1, 12)}.${random.int(1, 6)}.${random.int(1, 9)}`],
    iso_27001: [`A.${random.int(5, 8)}.${random.int(1, 40)}`],
    nist_800_53: [`CM-${random.int(1, 9)}`],
    hipaa: [`164.308.a.${random.int(1, 8)}`],
    tsc: [`CC${random.int(1, 9)}.${random.int(1, 6)}`],
  };
}
/* eslint-enable camelcase */

function generateDocument(params) {
  // The variant is part of the check id and name so each remediation style is searchable,
  // for example: check.id: "CUST-REM-ALL"
  const remediationVariant = random.choice(Object.keys(REMEDIATION_VARIANTS));

  const checkId = remediationVariant.startsWith('REAL_')
    ? `CUST-REAL-${remediationVariant.slice(5)}`
    : `CUST-REM-${remediationVariant}`;

  return {
    checksum: {
      hash: {
        sha1: random.hash(),
      },
    },
    check: {
      compliance: generateCompliance(),
      condition: random.choice(['all', 'any']),
      description: sentence(6),
      id: checkId,
      name: `[${remediationVariant}] Ensure ${word()} is ${random.choice([
        'enabled',
        'disabled',
      ])}.`,
      rationale: `${sentence(6)}`,
      reason: null,
      references: [`https://internal.docs/policies/${word()}`],
      remediation: REMEDIATION_VARIANTS[remediationVariant],
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
    wazuh: {
      ...generateRandomWazuh(params),
      agent: generateRandomAgent(),
    },
  };
}

module.exports = {
  generateDocument,
};
