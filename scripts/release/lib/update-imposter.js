function updateImposterSpecificationReference(configuration, logger) {
  try {
    logger.debug('Editing imposter specification reference');
    const fs = require('fs');
    const path = require('path');
    const specificationFile = path.join(
      __dirname,
      '../../..',
      'docker/imposter/wazuh-config.yml',
    );

    logger.debug(`Reading ${specificationFile} file`);
    const content = fs.readFileSync(specificationFile, 'utf8');

    const { version } = configuration;

    if (!version) {
      throw new Error('Version is not specified.');
    }

    // specFile: https://raw.githubusercontent.com/wazuh/wazuh/<BRANCH_VERSION>/api/api/spec/spec.yaml
    const updatedContent = content.replace(
      /specFile:\s+\S+/m,
      `specFile: https://raw.githubusercontent.com/wazuh/wazuh/${version}/api/api/spec/spec.yaml`,
    );

    if (content !== updatedContent) {
      logger.debug(
        `Updating [${specificationFile}] imposter specification file with latest changes`,
      );
      fs.writeFileSync(specificationFile, updatedContent, 'utf8');
      logger.info(`${specificationFile} file has been updated`);
    } else {
      logger.debug(`Nothing to change in ${specificationFile} file`);
    }
  } catch (error) {
    logger.error(`Error editing the specification file: ${error.message}`);
    process.exit(1);
  }
}

module.exports.updateImposterSpecificationReference =
  updateImposterSpecificationReference;
