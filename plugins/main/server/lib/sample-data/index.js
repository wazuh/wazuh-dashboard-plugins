function generateSampleDataWithDataset(dataset, options) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.generateDocument(options);
}
function getDatasetIndex(dataset) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.DATASET_INDEX || null;
}
module.exports.generateSampleDataWithDataset = generateSampleDataWithDataset;
module.exports.getDatasetIndex = getDatasetIndex;
