const random = require('../../lib/random');
const {
  generateRandomAgent,
  generateRandomWazuh,
} = require('../../shared-utils');
const { getRequirementIds } = require('./requirement-ids');

const DATASET_INDEX = 'wazuh-findings-v5-sample';
const DAYS = 30;
// Requirements tagged on one finding, per framework. A finding tagged with
// several values lands in several buckets, like a real rule tagged with more
// than one requirement of the same framework.
const MAX_REQUIREMENTS_PER_FRAMEWORK = 3;
const RULE_LEVELS = ['low', 'medium', 'high', 'critical'];

/**
 * Select the requirements of one framework for a document.
 *
 * The first one walks the framework's requirements in order, so generating as
 * many documents as a framework defines covers every one of its requirements
 * at least once. The rest are random, to exercise requirements holding more
 * than one finding.
 * @param {Array<string>} requirementIds every requirement of the framework
 * @param {number} position ordinal of the document being generated
 * @returns {Array<string>} the requirements to tag
 */
function selectRequirements(requirementIds, position) {
  const selected = [requirementIds[position % requirementIds.length]];
  const additional = random.int(0, MAX_REQUIREMENTS_PER_FRAMEWORK - 1);

  for (let i = 0; i < additional; i++) {
    const candidate = random.choice(requirementIds);

    if (!selected.includes(candidate)) {
      selected.push(candidate);
    }
  }

  return selected;
}

/**
 * Build the compliance object of a document, covering every framework
 * @param {number} position ordinal of the document being generated
 * @returns {Object} requirements by compliance field
 */
function generateCompliance(position) {
  return Object.fromEntries(
    Object.entries(getRequirementIds()).map(([framework, requirementIds]) => [
      framework,
      selectRequirements(requirementIds, position),
    ]),
  );
}

// Ordinal of the next document when the caller does not number them, so a run
// still walks the requirements instead of sampling them at random.
let generated = 0;

function generateDocument(params = {}) {
  const position =
    typeof params.index === 'number' ? params.index : generated++;
  const timestamp = random.date(DAYS);
  const compliance = generateCompliance(position);

  return {
    '@timestamp': timestamp,
    data_stream: { dataset: 'wazuh.alerts', type: 'logs' },
    event: {
      category: ['configuration'],
      created: timestamp,
      dataset: 'wazuh.alerts',
      kind: 'event',
      module: 'regulatory-compliance',
      outcome: 'failure',
    },
    rule: {
      description: 'Sample finding for regulatory compliance requirements',
      id: `compliance-${String(position).padStart(6, '0')}`,
      name: 'Regulatory compliance sample',
      ruleset: 'wazuh',
    },
    tags: ['sample-data', 'regulatory-compliance'],
    wazuh: {
      ...generateRandomWazuh(params),
      agent: generateRandomAgent(),
      integration: {
        name: 'wazuh-regulatory-compliance',
        category: 'Security',
        decoders: ['wazuh-regulatory-compliance'],
      },
      rule: {
        id: `compliance-${String(position).padStart(6, '0')}`,
        title: `Sample finding for ${Object.entries(compliance)
          .map(([framework, requirements]) => `${framework} ${requirements[0]}`)
          .join(', ')}`,
        level: random.choice(RULE_LEVELS),
        status: 'stable',
        tags: ['sample-data', 'regulatory-compliance'],
        compliance,
      },
    },
  };
}

module.exports = { generateDocument, DATASET_INDEX };
