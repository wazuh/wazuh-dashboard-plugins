const logger = require('./logger');

function updatePackageManifest(
  manifestPath,
  { version, revision, platformVersion },
) {
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
  version &&
    (packageJson.version = version) &&
    logger.debug(`Change version to ${packageJson.version}`);
  revision &&
    (packageJson.revision = revision) &&
    logger.debug(`Change revision to ${packageJson.revision}`);
  platformVersion &&
    (packageJson.pluginPlatform.version = platformVersion) &&
    logger.debug(
      `Change platform version to ${packageJson.pluginPlatform.version}`,
    );

  logger.debug(`Updating ${manifestPath}: ${JSON.stringify(packageJson)}`);
  fs.writeFileSync(manifestPath, JSON.stringify(packageJson, null, 2));
  logger.info(`Updated ${manifestPath}`);
}

module.exports = {
  updatePackageManifest: updatePackageManifest,
};
