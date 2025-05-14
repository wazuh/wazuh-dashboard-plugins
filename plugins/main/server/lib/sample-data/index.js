function generateSampleDataWithDataset(dataset, options) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.generateDocument(options);
}

module.exports.generateSampleDataWithDataset = generateSampleDataWithDataset;
