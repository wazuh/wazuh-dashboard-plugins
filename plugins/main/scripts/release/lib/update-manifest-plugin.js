const logger = require('./logger');

function updatePluginManifest(manifestPath, { version, revision }) {
  if (!manifestPath) {
    logger.error(
      `plugin manifest file is not defined. Use --manifest-plugin <path/to/file>.`,
    );
    process.exit(1);
  }

  if (!version) {
    logger.error(`version is not defined. Use --version <version>.`);
    process.exit(1);
  }

  if (!revision) {
    logger.error(`revision is not defined. Use --revision <revision>.`);
    process.exit(1);
  }

  const fs = require('fs');
  logger.debug(`Reading file ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  logger.debug(`Read file ${manifestPath}: ${JSON.stringify(manifest)}`);
  manifest.version = `${version}-${revision}`;
  logger.debug(`Change version to: ${manifestPath}: ${manifest.version}`);

  logger.debug(`Updating ${manifestPath}: ${JSON.stringify(manifest)}`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  logger.info(`Updated ${manifestPath}`);
}

module.exports = {
  updatePluginManifest: updatePluginManifest,
};
