// NodeJS script which receives a version, revision and/or platform version and updates
// the package.json file
// Usage: node bump.js <options>
// Help: node bump.js --help
// Examples: node bump.js --examples

// Process
// 1. Take values from stdin
// 2. Edit the package and plugin manifest files
// 3. Display warning about manual changes

const cliName = 'bump';
const cliDescription = `Bump the plugin version, revision and/or platform version
Some warning messages are sent to stderr.`;

// Default configuration
const defaultConfiguration = {
  displayConfiguration: false,
  displayExamples: false,
  displayHelp: false,
  version: '',
  revision: '',
  platformVersion: '',
  manifestPackage: '',
  manifestPlugin: '',
};

const logger = require('./lib/logger');

const { readPackageManifest } = require('./lib/read-manifest-package');
const { updatePackageManifest } = require('./lib/update-manifest-package');
const { updatePluginManifest } = require('./lib/update-manifest-plugin');

/**
 *
 * @param {String[]} input Input parameters
 * @returns {Object} the configuration values
 */
function parse(input) {
  const configuration = {};
  // Parse the input parameters
  while (input.length) {
    // Extract the first parameter
    const [parameter] = input.splice(0, 1);

    // Compare the parameter
    switch (parameter) {
      case '--debug':
        // Set the logger to debug mode
        logger.setLevel(0);
        break;
      case '--display-configuration':
        // Display the configuration
        configuration.displayConfiguration = true;
        break;
      case '--examples':
        // Display the examples
        configuration.displayExamples = true;
        break;
      case '--help':
        // Display the help
        configuration.displayHelp = true;
        break;
      case '--version': {
        // Set the version
        const version = typeof input[0] === 'string' && input[0];

        if (version) {
          if (/\d+\.\d+\.\d+/.test(version)) {
            configuration.version = version;
            input.splice(0, 1);
          } else {
            logger.error(
              'version parameter is not valid. Expected format: X.Y.Z where X,Y, and Z are numbers.',
            );
            process.exit(1);
          }
        } else {
          logger.error('version parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      case '--revision': {
        // Set the version
        const revision = typeof input[0] === 'string' && input[0];

        if (revision) {
          if (/\d{2}/.test(revision)) {
            configuration.revision = revision;
            input.splice(0, 1);
          } else {
            logger.error(
              'revision parameter is not valid. Expected format: Number',
            );
            process.exit(1);
          }
        } else {
          logger.error('revision parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      case '--platform-version': {
        // Set the version
        const platformVersion = typeof input[0] === 'string' && input[0];

        if (platformVersion) {
          if (/\d+\.\d+\.\d+/.test(platformVersion)) {
            configuration.platformVersion = platformVersion;
            input.splice(0, 1);
          } else {
            logger.error(
              'platform-version parameter is not valid. Expected format: X.Y.Z where X,Y, and Z are numbers.',
            );
            process.exit(1);
          }
        } else {
          logger.error('platform-version parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      case '--manifest-package': {
        // Set the version
        const manifestPackage = typeof input[0] === 'string' && input[0];

        if (manifestPackage) {
          configuration.manifestPackage = manifestPackage;
          input.splice(0, 1);
        } else {
          logger.error('manifest-package parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      case '--manifest-plugin': {
        // Set the version
        const manifestPlugin = typeof input[0] === 'string' && input[0];

        if (manifestPlugin) {
          configuration.manifestPlugin = manifestPlugin;
          input.splice(0, 1);
        } else {
          logger.error('manifest-plugin parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      default: {
      }
    }
  }
  return configuration;
}

const usageOptionsMessage = `Options:
  --debug                                             Set the logger to debug mode.
  --display-configuration                             Display the configuration. Log to sterr.
  --examples                                          Display examples of usage.
  --help                                              Display the help.
  --manifest-package <manifest-package>               Set the package manifest file location.
  --manifest-plugin <manifest-plugin>                 Set the plugin platform manifest file location.
  --platform-version <platform-version>               Set the platform version.
  --revision <revision>                               Set the revision.
  --version <version>                                 Set the version.`;

/**
 * Display the CLI help
 */
function displayHelp() {
  console.log(`${cliName} - Help
${cliDescription}

Usage: node ${cliFilePath} [options]

${usageOptionsMessage}
`);
}

/**
 * Display the examples
 */
function displayExamples() {
  console.log(`
- Change the plugin version
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --version 4.5.0

- Change the plugin revision
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --revision 02 --manifest-package ../package.json

- Change the platform version
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --platform-version 2.8.0

- Change the plugin version, revision and platform version
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --version 4.5.0 --revision 02 --platform-version 2.8.0
`);
}

// Display the message to do manual changes
function displayMessageManualChanges() {
  logger.warn(
    'Some files could require to do changes manually. See RELEASING.md.',
  );
}

function run(configuration) {
  const {
    version,
    revision,
    platformVersion,
    manifestPackage,
    manifestPlugin,
  } = configuration;
  version && logger.info(`Version: ${version}`);
  revision && logger.info(`Revision: ${revision}`);
  platformVersion && logger.info(`Platform version: ${platformVersion}`);
  manifestPackage && logger.info(`Package manifest: ${manifestPackage}`);
  manifestPlugin && logger.info(`Plugin manifest: ${manifestPlugin}`);

  logger.info(
    'This will update the manifest files: package and platform plugin.',
  );

  updatePackageManifest(manifestPackage, {
    version,
    revision,
    platformVersion,
  });

  updatePluginManifest(manifestPlugin, {
    version,
    revision,
  });

  displayMessageManualChanges();
}

function main(input) {
  try {
    // Display the help information and exit if there is no parameters
    if (input.length === 0) {
      displayHelp();
      process.exit(1);
    }

    const configuration = {
      ...defaultConfiguration,
      ...parse(input),
    };

    // Display the configuration
    if (configuration.displayConfiguration) {
      /* Send to stderr. This does the configuration can be displayed and redirect the stdout output
      to a file */
      console.error(configuration);
    }

    // Display the help
    if (configuration.displayHelp) {
      displayHelp();
      process.exit(0);
    }

    // Display the examples of usage
    if (configuration.displayExamples) {
      displayExamples();
      process.exit(0);
    }

    // Check version is set
    if (!configuration.version || !configuration.revision) {
      const { version: manifestVersion, revision: manifestRevision } =
        readPackageManifest(configuration.manifestPackage);
      if (!configuration.version) {
        logger.warn(
          `version is not defined. Using from the current package manifest ${configuration.manifestPackage}: ${manifestVersion}`,
        );
        configuration.version = manifestVersion;
      }
      if (!configuration.revision) {
        logger.warn(
          `revision is not defined. Using from the current package manifest ${configuration.manifestPackage}: ${manifestRevision}`,
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

let cliFilePath = __dirname;

if (require.main === module) {
  cliFilePath = process.argv[1];
  const consoleInputParameters = [...process.argv].slice(2);
  main(consoleInputParameters);
}
