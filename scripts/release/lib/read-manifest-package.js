const logger = require('./logger');

function readPackageManifest(manifestPath) {
  if (!manifestPath) {
    logger.error(
      `package manifest file is not defined. Use --manifest-package <path/to/file>.`,
    );
    process.exit(1);
  }
  const fs = require('fs');
  logger.debug(`Reading file ${manifestPath}`);
  const packageJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  logger.debug(`Read file ${manifestPath}: ${JSON.stringify(packageJson)}`);

  return packageJson;
}

module.exports = {
  readPackageManifest: readPackageManifest,
};
