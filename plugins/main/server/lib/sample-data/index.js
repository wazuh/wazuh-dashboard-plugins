const fs = require('fs');
const path = require('path');

function generateSampleDataWithDataset(dataset, options) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.generateDocument(options);
}
function getDatasetIndex(dataset) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.DATASET_INDEX || null;
}
function getDatasetTemplate(dataset) {
  const templatePath = path.join(
    __dirname,
    `./dataset/${dataset}/template.json`,
  );
  if (!fs.existsSync(templatePath)) {
    return null;
  }
  const templateJSON = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  return templateJSON.template || null;
}
module.exports.generateSampleDataWithDataset = generateSampleDataWithDataset;
module.exports.getDatasetIndex = getDatasetIndex;
module.exports.getDatasetTemplate = getDatasetTemplate;
