function generateSampleData(dataset, options) {
  const datasetDefinition = require(`./dataset/${dataset}/main`);
  return datasetDefinition.generate_document(options);
}

module.exports.generateSampleData = generateSampleData;
