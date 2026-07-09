const { generateFinding } = require('../../finding-generator');

function generateDocument(params = {}) {
  return generateFinding(params, __dirname);
}

module.exports = { generateDocument };
