const fs = require('fs');
const path = require('path');

function generateSampleDataWithDataset(dataset, options) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.generateDocument(options);
}

function generateSampleDataWithFinding(finding, options) {
  const findingDefinition = require(`./findings/${finding}/main`);
  return findingDefinition.generateDocument(options);
}

function listFindings() {
  const root = path.join(__dirname, 'findings');
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (entry === 'main.js') {
        out.push(path.relative(root, dir));
      }
    }
  })(root);
  return out.sort();
}

module.exports.generateSampleDataWithDataset = generateSampleDataWithDataset;
module.exports.generateSampleDataWithFinding = generateSampleDataWithFinding;
module.exports.listFindings = listFindings;
