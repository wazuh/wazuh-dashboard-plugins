const fs = require('fs');
const path = require('path');
const {
  cmmcRequirementsFile,
  cmmcRequirementsAliases,
} = require('../../../../common/compliance-requirements/cmmc-requirements');
const {
  fedrampRequirementsFile,
} = require('../../../../common/compliance-requirements/fedramp-requirements');
const {
  gdprRequirementsFile,
  gdprRequirementsAliases,
} = require('../../../../common/compliance-requirements/gdpr-requirements');
const {
  hipaaRequirementsFile,
  hipaaRequirementsAliases,
} = require('../../../../common/compliance-requirements/hipaa-requirements');
const {
  iso27001RequirementsFile,
} = require('../../../../common/compliance-requirements/iso27001-requirements');
const {
  nis2RequirementsFile,
} = require('../../../../common/compliance-requirements/nis2-requirements');
const {
  nistRequirementsFile,
} = require('../../../../common/compliance-requirements/nist-requirements');
const {
  nist171RequirementsFile,
} = require('../../../../common/compliance-requirements/nist-171-requirements');
const {
  pciRequirementsFile,
} = require('../../../../common/compliance-requirements/pci-requirements');
const {
  tscRequirementsFile,
} = require('../../../../common/compliance-requirements/tsc-requirements');

// The ruleset tags some frameworks in its own notation, which the compliance
// views resolve through the framework's aliases, so a sample value is valid
// when it names either a control or an alias.
const ALIASES = {
  cmmc: cmmcRequirementsAliases,
  gdpr: gdprRequirementsAliases,
  hipaa: hipaaRequirementsAliases,
};

// Definitions by the compliance field of a finding
// (`wazuh.rule.compliance.<framework>`).
const DEFINITIONS = {
  cmmc: cmmcRequirementsFile,
  fedramp: fedrampRequirementsFile,
  gdpr: gdprRequirementsFile,
  hipaa: hipaaRequirementsFile,
  iso_27001: iso27001RequirementsFile,
  nis2: nis2RequirementsFile,
  nist_800_53: nistRequirementsFile,
  nist_800_171: nist171RequirementsFile,
  pci_dss: pciRequirementsFile,
  tsc: tscRequirementsFile,
};

/**
 * Every pre-generated findings document of every findings dataset
 * @returns {Array<[string, Object]>} pairs of source file and document
 */
function loadFindings() {
  const findings = [];

  for (const dataset of fs.readdirSync(__dirname)) {
    if (!dataset.startsWith('findings-')) {
      continue;
    }

    const datasetPath = path.join(__dirname, dataset);

    for (const file of fs.readdirSync(datasetPath)) {
      if (!file.endsWith('.json') || file === 'template.json') {
        continue;
      }

      const filePath = path.join(datasetPath, file);
      const documents = fs
        .readFileSync(filePath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      for (const document of documents) {
        findings.push([path.join(dataset, file), document]);
      }
    }
  }

  return findings;
}

// A sample finding tagged with a requirement no definition holds is counted
// under "Others" in the compliance views instead of its own requirement, which
// makes the sample data useless for checking those views.
describe('sample findings compliance requirements', () => {
  const findings = loadFindings();

  it('finds pre-generated findings to check', () => {
    expect(findings.length).toBeGreaterThan(0);
  });

  it('only tags requirements the definitions resolve', () => {
    const unresolved = [];

    for (const [source, document] of findings) {
      const compliance = document?.wazuh?.rule?.compliance || {};

      for (const [framework, requirements] of Object.entries(compliance)) {
        if (!DEFINITIONS[framework]) {
          unresolved.push(`${source}: unknown framework "${framework}"`);
          continue;
        }

        for (const requirement of [].concat(requirements)) {
          const aliases = ALIASES[framework] || {};

          if (!DEFINITIONS[framework][requirement] && !aliases[requirement]) {
            unresolved.push(`${source}: ${framework} "${requirement}"`);
          }
        }
      }
    }

    expect([...new Set(unresolved)]).toEqual([]);
  });
});
