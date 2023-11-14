function updateChangelog(
  { path: manifestPath, version, revision, platformVersion },
  logger,
) {
  if (!manifestPath) {
    logger.error(
      `changelog file is not defined. Use --manifest-changelog <path/to/file>.`,
    );
    process.exit(1);
  }
  const fs = require('fs');
  logger.debug(`Reading file ${manifestPath}`);
  const content = fs.readFileSync(manifestPath, 'utf8');
  logger.debug(`Read file ${manifestPath}`);
  const reChangelogEntry = `(Wazuh v${version.replace(
    /\./g,
    '\\.',
  )} - [\\w\\s]+) ([\\d.]+) - Revision (\\d+)`;
  if (version && (revision || platformVersion)) {
    logger.debug(
      'Regular expression to find in changelog: ' + reChangelogEntry,
    );
    if (content.search(reChangelogEntry) > -1) {
      const textReplaceEntry =
        '$1' +
        ' ' +
        (platformVersion || '$2') +
        ' ' +
        '- Revision' +
        ' ' +
        (revision || '$3');
      logger.debug(
        `Update changelog: regular expression ${reChangelogEntry}: ${textReplaceEntry}`,
      );
      const newContent = content.replace(
        new RegExp(reChangelogEntry),
        textReplaceEntry,
      );
      if (newContent !== content) {
        logger.debug(`Updating ${manifestPath}`);
        fs.writeFileSync(manifestPath, newContent);
        logger.info(`Updated ${manifestPath}`);
      }
    } else {
      logger.warn(
        `Changelog entry not found for ${[
          { text: 'version', value: version },
          { text: 'revision', value: revision },
          { text: 'platformVersion', value: platformVersion },
        ]
          .filter(({ value }) => value)
          .map(({ text, value }) => `${text}: ${value}`)
          .join(', ')}. YOU SHOULD ADD THE ENTRY TO THE CHANGELOG FILE.`,
      );
    }
  }
}

module.exports = {
  updateChangelog: updateChangelog,
};
