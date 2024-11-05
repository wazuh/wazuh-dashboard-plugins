// NodeJS script which receives a version, revision and/or platform version and updates
// the package.json file
// Usage: node bump.js <options>
// Help: node bump.js --help
// Examples: node bump.js --examples

// Process
// 1. Take values from stdin
// 2. List plugins
// 3. For each plugin:
//   3.1. Edit the package and plugin manifest files
//   3.2. Run the specific bump
// 4. Update CHANGELOG.md
// 3. Display warning about manual changes

const cliName = 'bump';
const cliDescription = `Bump the plugin version, revision or/and platform version for each plugin. Run specific bump task of each plugin. Bump changelog file.
Some warning messages are sent to stderr.`;

const logger = require('./lib/logger').create(['bump']);

const { readPackageManifest } = require('./lib/read-manifest-package');
const { updatePackageManifest } = require('./lib/update-manifest-package');
const { updatePluginManifest } = require('./lib/update-manifest-plugin');
const { updateChangelog } = require('./lib/update-changelog');
const path = require('path');
const fs = require('fs');
const {
  updateImposterSpecificationReference,
} = require('./lib/update-imposter');

const cli = require('../lib/cli/cli')(
  cliName,
  cliDescription,
  `node ${__filename} [options]`,
  [
    {
      long: 'debug',
      description: 'Enable debug in the logger.',
      parse: (parameter, input, { logger, option }) => {
        logger.setLevel(0);
        return {
          [option.long]: true,
        };
      },
    },
    {
      long: 'display-configuration',
      description: 'Display the configuration.',
      parse: (parameter, input, { logger, option }) => {
        return {
          [option.long]: true,
        };
      },
    },
    {
      long: 'help',
      description: 'Display the help.',
      parse: (parameter, input, { logger, option }) => {
        return {
          [option.long]: true,
        };
      },
    },
    {
      long: 'manifest-changelog',
      description: 'Set the path to the changelog file.',
      help: '<file-path>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          input.splice(0, 1);
          return {
            [option.long]: nextParameter,
          };
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'manifest-package',
      description:
        'Set the package manifest file location to take the default values.',
      help: '<file-path>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          input.splice(0, 1);
          return {
            [option.long]: nextParameter,
          };
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'platform-version',
      description: 'Set the platform version.',
      help: '<platform-version>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          if (/\d+\.\d+\.\d+/.test(nextParameter)) {
            input.splice(0, 1);
            return {
              [option.long]: nextParameter,
            };
          } else {
            logger.error(
              `${parameter} parameter is not valid. EExpected format: X.Y.Z where X,Y, and Z are numbers.`,
            );
            process.exit(1);
          }
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'plugin-main-generate-api-data-spec',
      description: 'Set the URL of API spec file to extract the data.',
      help: '<url-spec-file>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          input.splice(0, 1);
          return {
            [option.long]: nextParameter,
          };
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'plugins-directory',
      description: 'Set the plugins directory where they are located.',
      help: '<directory>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          input.splice(0, 1);
          return {
            [option.long]: nextParameter,
          };
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'revision',
      description: 'Set the revision.',
      help: '<revision>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          if (/\d{2}/.test(nextParameter)) {
            input.splice(0, 1);
            return {
              [option.long]: nextParameter,
            };
          } else {
            logger.error(
              `${parameter} parameter is not valid. Expected format: Number`,
            );
            process.exit(1);
          }
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
    {
      long: 'version',
      description: 'Set the version.',
      help: '<version>',
      parse: (parameter, input, { logger, option }) => {
        const [nextParameter] = input;

        if (nextParameter) {
          if (/\d+\.\d+\.\d+/.test(nextParameter)) {
            input.splice(0, 1);
            return {
              [option.long]: nextParameter,
            };
          } else {
            logger.error(
              `${parameter} parameter is not valid. Expected format: X.Y.Z where X,Y, and Z are numbers.`,
            );
            process.exit(1);
          }
        } else {
          logger.error(`${parameter} parameter is not defined.`);
          process.exit(1);
        }
      },
    },
  ],
);

// Display the message to do manual changes
function bumpPlugin(
  { version, revision, platformVersion, manifestPackage, manifestPlugin },
  logger,
) {
  version && logger.info(`Version: ${version}`);
  revision && logger.info(`Revision: ${revision}`);
  platformVersion && logger.info(`Platform version: ${platformVersion}`);
  manifestPackage && logger.info(`Package manifest: ${manifestPackage}`);
  manifestPlugin && logger.info(`Plugin manifest: ${manifestPlugin}`);

  logger.info(
    'This will update the manifest files: package and platform plugin.',
  );
  updatePackageManifest(
    {
      path: manifestPackage,
      version,
      revision,
      platformVersion,
    },
    logger,
  );
  updatePluginManifest(
    {
      path: manifestPlugin,
      version,
      revision,
    },
    logger,
  );
}

function run(configuration) {
  // Parse the unparsed options and add to the configuration when using the tag script that doesn't
  // include some settings
  if (configuration._unparsed) {
    const { _unparsed, ...rest } = configuration;
    configuration = {
      ...rest,
      ...cli.parse(configuration._unparsed),
    };
  }

  // Set the bump logger level to debug
  if (configuration['debug']) {
    logger.setLevel(0);
  }

  const {
    version,
    revision,
    'platform-version': platformVersion,
    'manifest-changelog': manifestChangelog,
    'plugins-directory': pluginsDirectory,
  } = configuration;

  if (!pluginsDirectory) {
    logger.error('plugins-directory is not defined.');
    process.exit(1);
  }

  logger.debug(`Getting the list of plugins from ${pluginsDirectory}`);

  const pluginsDirectories = fs
    .readdirSync(path.resolve(pluginsDirectory), {
      withFileTypes: true,
    })
    .filter(({ isDirectory }) => isDirectory)
    .map(({ name }) => name);
  logger.info(
    `Plugin directories from ${pluginsDirectory}: ${pluginsDirectories.join(
      ', ',
    )}`,
  );

  for (const pluginDirectory of pluginsDirectories) {
    const pluginDirPath = path.resolve(pluginsDirectory, pluginDirectory);
    const loggerPlugin = logger.create(
      ['bump', pluginDirectory],
      logger.getLevel(),
    );

    const configurationBump = {
      ...configuration,
      version,
      revision,
      platformVersion,
      manifestPackage: path.join(pluginDirPath, 'package.json'),
      manifestPlugin: path.join(pluginDirPath, 'opensearch_dashboards.json'),
    };

    bumpPlugin(configurationBump, loggerPlugin);

    const specificBumpPath = path.join(
      pluginDirPath,
      'scripts/release/bump.js',
    );
    loggerPlugin.debug(
      `Checking if the plugin ${pluginDirectory} has a specific bump in ${specificBumpPath}`,
    );
    if (fs.existsSync(specificBumpPath)) {
      const bump = require(specificBumpPath);
      loggerPlugin.debug(
        `Configuration to use with the specific bump script in ${pluginDirectory}: ${JSON.stringify(
          configurationBump,
        )}`,
      );
      loggerPlugin.info('Calling to specific bump script');
      bump(
        {
          ...configurationBump,
        },
        logger.create(['bump', pluginDirectory, 'specific']),
      );
    } else {
      loggerPlugin.debug(
        `Plugin ${pluginDirectory} has no a specific bump in ${specificBumpPath}`,
      );
    }
  }

  updateChangelog(
    {
      path: manifestChangelog,
      version,
      revision,
      platformVersion,
    },
    logger,
  );

  updateImposterSpecificationReference(configuration, logger);
}

function main() {
  try {
    const consoleInputParameters = [...process.argv].slice(2).join(' ');

    const configuration = cli.parse(consoleInputParameters);

    // Display the configuration
    if (configuration['display-configuration']) {
      /* Send to stderr. This does the configuration can be displayed and redirect the stdout output
      to a file */
      console.error(configuration);
    }

    // Display the help
    if (configuration['help']) {
      cli.help();
    }

    // Check version is set
    if (!configuration.version || !configuration.revision) {
      const { version: manifestVersion, revision: manifestRevision } =
        readPackageManifest(configuration['manifest-package'], logger);
      if (!configuration.version) {
        logger.warn(
          `version is not defined. Using from the current package manifest ${configuration['manifest-package']}: ${manifestVersion}`,
        );
        configuration.version = manifestVersion;
      }
      if (!configuration.revision) {
        logger.warn(
          `revision is not defined. Using from the current package manifest ${configuration['manifest-package']}: ${manifestRevision}`,
        );
        configuration.revision = manifestRevision;
      }
    }

    run(configuration);
  } catch (error) {
    logger.error(`An unexpected error: ${error}. ${error.stack}`);
    process.exit(1);
  }
}

module.exports = run;

if (require.main === module) {
  main();
}
