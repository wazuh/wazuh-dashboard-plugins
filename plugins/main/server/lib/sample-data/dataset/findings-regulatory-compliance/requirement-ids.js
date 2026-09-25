const fs = require('fs');
const path = require('path');

/**
 * Reads the requirement identifiers of every regulatory compliance framework
 * from the definition files the compliance views use, so the sample data can
 * never name a requirement the views do not know.
 *
 * The definitions are TypeScript modules and this generator also runs from
 * scripts/sample-data with plain Node, which cannot require them, so the
 * identifiers are read from the source. Every definition file is a flat object
 * literal whose top-level entries are the identifiers, either a control
 * (`'A.5.1': {`) or an alias of a ruleset compliance tag (`'IV_32.1.a': '…',`).
 */
const DEFINITIONS_DIRECTORY = path.resolve(
  __dirname,
  '../../../../../common/compliance-requirements',
);

// Compliance field of a finding (`wazuh.rule.compliance.<framework>`) -> the
// file defining that framework's requirements.
const DEFINITION_FILES = {
  cmmc: 'cmmc-requirements.ts',
  fedramp: 'fedramp-requirements.ts',
  gdpr: 'gdpr-requirements.ts',
  hipaa: 'hipaa-requirements.ts',
  iso_27001: 'iso27001-requirements.ts',
  nis2: 'nis2-requirements.ts',
  nist_800_53: 'nist-requirements.ts',
  nist_800_171: 'nist-171-requirements.ts',
  pci_dss: 'pci-requirements.ts',
  tsc: 'tsc-requirements.ts',
};

// A top-level entry of a definition object: two spaces of indentation, then a
// single-quoted identifier. Deeper keys (title, description) are not matched.
const REQUIREMENT_ID = /^ {2}'((?:[^'\\]|\\.)*)':/gm;

let requirementIdsCache = null;

/**
 * Read the requirement identifiers of one framework
 * @param {string} framework
 * @param {string} file
 * @returns {Array<string>} identifiers, in definition order, without duplicates
 */
function readRequirementIds(framework, file) {
  const filePath = path.join(DEFINITIONS_DIRECTORY, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const ids = [
    ...new Set(
      [...content.matchAll(REQUIREMENT_ID)].map(([, id]) =>
        id.replace(/\\(.)/g, '$1'),
      ),
    ),
  ];

  if (!ids.length) {
    throw new Error(
      `No requirement identifier was read from "${filePath}". The definition ` +
        'files changed shape and this reader needs updating.',
    );
  }

  return ids;
}

/**
 * Get the requirement identifiers of every framework, read once and cached
 * @returns {Object} identifiers by compliance field
 */
function getRequirementIds() {
  if (!requirementIdsCache) {
    requirementIdsCache = Object.fromEntries(
      Object.entries(DEFINITION_FILES).map(([framework, file]) => [
        framework,
        readRequirementIds(framework, file),
      ]),
    );
  }

  return requirementIdsCache;
}

module.exports = { getRequirementIds, DEFINITION_FILES };
