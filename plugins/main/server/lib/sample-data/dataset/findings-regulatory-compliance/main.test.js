const { generateDocument } = require('./main');
const { getRequirementIds } = require('./requirement-ids');
const {
  cmmcRequirementsFile,
} = require('../../../../../common/compliance-requirements/cmmc-requirements');
const {
  fedrampRequirementsFile,
} = require('../../../../../common/compliance-requirements/fedramp-requirements');
const {
  gdprRequirementsFile,
} = require('../../../../../common/compliance-requirements/gdpr-requirements');
const {
  hipaaRequirementsFile,
} = require('../../../../../common/compliance-requirements/hipaa-requirements');
const {
  iso27001RequirementsFile,
} = require('../../../../../common/compliance-requirements/iso27001-requirements');
const {
  nis2RequirementsFile,
} = require('../../../../../common/compliance-requirements/nis2-requirements');
const {
  nistRequirementsFile,
} = require('../../../../../common/compliance-requirements/nist-requirements');
const {
  nist171RequirementsFile,
} = require('../../../../../common/compliance-requirements/nist-171-requirements');
const {
  pciRequirementsFile,
} = require('../../../../../common/compliance-requirements/pci-requirements');
const {
  tscRequirementsFile,
} = require('../../../../../common/compliance-requirements/tsc-requirements');

// The definitions the compliance views resolve a finding's requirement against.
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

describe('findings-regulatory-compliance requirement-ids', () => {
  // The identifiers are read from the definition source, so a change of shape
  // there has to fail here rather than silently generate unknown values.
  it('reads exactly the controls every definition file exports', () => {
    const requirementIds = getRequirementIds();

    expect(Object.keys(requirementIds).sort()).toEqual(
      Object.keys(DEFINITIONS).sort(),
    );

    for (const [framework, definition] of Object.entries(DEFINITIONS)) {
      expect(requirementIds[framework].ids.sort()).toEqual(
        Object.keys(definition).sort(),
      );
    }
  });

  it('reads the ruleset compliance tags of each control', () => {
    const { hipaa } = getRequirementIds();

    expect(hipaa.aliasesByRequirement['164.312(e)(1)'].sort()).toEqual([
      '164.312.e',
      '164.312.e.1',
    ]);
  });
});

describe('findings-regulatory-compliance generateDocument', () => {
  it('tags every framework of the compliance views', () => {
    const { compliance } = generateDocument({ index: 0 }).wazuh.rule;

    expect(Object.keys(compliance).sort()).toEqual(
      Object.keys(DEFINITIONS).sort(),
    );
  });

  // A document names a requirement either with the identifier of the standard
  // or with a compliance tag of the ruleset, as real findings do.
  it('only tags codes that resolve to a documented requirement', () => {
    const { hipaa, gdpr, cmmc } = getRequirementIds();
    const aliases = { hipaa, gdpr, cmmc };
    const isAlias = (framework, code) =>
      Object.values(aliases[framework]?.aliasesByRequirement || {}).some(
        codes => codes.includes(code),
      );

    for (let index = 0; index < 200; index++) {
      const { compliance } = generateDocument({ index }).wazuh.rule;

      for (const [framework, codes] of Object.entries(compliance)) {
        expect(codes.length).toBeGreaterThan(0);

        for (const code of codes) {
          expect(
            Boolean(DEFINITIONS[framework][code]) || isAlias(framework, code),
          ).toBe(true);
        }
      }
    }
  });

  it('writes the ruleset notation as well as the standard identifiers', () => {
    const dotted = [];

    for (let index = 0; index < 200; index++) {
      dotted.push(
        ...generateDocument({ index }).wazuh.rule.compliance.hipaa.filter(
          code => !code.includes('('),
        ),
      );
    }

    expect(dotted.length).toBeGreaterThan(0);
  });

  // Generating as many documents as a framework defines has to reach every one
  // of its requirements, so a full run leaves no requirement without findings.
  it('covers every requirement of a framework over a full run', () => {
    // NIS2 declares no alias, so its codes are the requirements themselves.
    const nis2Requirements = Object.keys(nis2RequirementsFile);
    const covered = new Set();

    for (let index = 0; index < nis2Requirements.length; index++) {
      const { compliance } = generateDocument({ index }).wazuh.rule;

      covered.add(compliance.nis2[0]);
    }

    expect([...covered].sort()).toEqual(nis2Requirements.sort());
  });

  it('generates a document for the findings index shape', () => {
    const document = generateDocument({ index: 3 });

    expect(document['@timestamp']).toEqual(expect.any(String));
    expect(document.wazuh.agent.id).toEqual(expect.any(String));
    expect(document.wazuh.cluster.name).toEqual(expect.any(String));
  });
});
