const { generateFinding } = require('../../finding-generator');

const DATASET_INDEX = 'wazuh-findings-v5';

function generateDocument(params = {}) {
  return generateFinding(params, __dirname);
}

module.exports = { generateDocument };
