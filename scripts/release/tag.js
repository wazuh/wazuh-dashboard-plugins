// NodeJS script which creates the tags in local and remote for the supported versions.
// It receives a version, revision and/or platform version and for each
// supported version: updates the package and plugin manifest files and create the tag.
// Usage: node tag.js <options>
// Help: node tag.js --help
// Examples: node tag.js --examples

// Process
// 1. Parse stdin
// 2. For each supported platform version
//   2.1. Checkout to the platform base branch
//   2.2. Prune local branches and tags
//   2.3. Edit the package manifest file
//   2.4. Edit the plugin manifest file
//   2.5. Commit
//   2.6. Create tag
//   2.7. Push tag
//   2.8. Reset local branch to remote branch
// 3. Optional. Export tags to file

const cliName = 'tag';
const cliDescription = `Create the tags in remote repository for the supported versions.
Some warning messages are sent to stderr.`;

// Default configuration
const defaultConfiguration = {
  displayConfiguration: false,
  displayExamples: false,
  displayHelp: false,
  version: '',
  revision: '',
  platformVersion: '',
  ignoreConfirmation: false,
  manifestPackage: '',
  manifestPlugin: '',
  tagSuffix: '',
  exportTagsToFile: '',
};

const logger = require('./lib/logger');

const { readPackageManifest } = require('./lib/read-manifest-package');
const bump = require('./bump');
const readline = require('readline');

// Supported versions
function getSupportedVersions(pluginVersion) {
  return {
    Kibana: {
      branch: `${pluginVersion}-7.16`,
      versions: [
        ...[...Array(4).keys()].map(idx => `7.16.${idx}`),
        ...[...Array(12).keys()].map(idx => `7.17.${idx}`),
      ],
      manifestPluginPath: 'kibana.json',
    },
    OpenDistro: {
      branch: `${pluginVersion}-7.10`,
      versions: ['7.10.2'],
      manifestPluginPath: 'kibana.json',
    },
    OpenSearch: {
      branch: pluginVersion,
      versions: ['2.6.0'],
      manifestPluginPath: 'opensearch_dashboards.json',
    },
  };
}

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
      case '--export-tags': {
        // Export tags to file
        const exportTagsToFile = typeof input[0] === 'string' && input[0];
        if (exportTagsToFile) {
          configuration.exportTagsToFile = exportTagsToFile;
          input.splice(0, 1);
        } else {
          logger.error('export-tags parameter is not defined.');
          process.exit(1);
        }
        break;
      }
      case '--examples':
        // Display the examples
        configuration.displayExamples = true;
        break;
      case '--help':
        // Display the help
        configuration.displayHelp = true;
        break;
      case '--ignore-confirmation':
        // Display the help
        configuration.ignoreConfirmation = true;
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
      case '--tag-suffix': {
        // Set the version
        const tagSuffix = typeof input[0] === 'string' && input[0];

        if (tagSuffix) {
          configuration.tagSuffix = tagSuffix;
          input.splice(0, 1);
        } else {
          logger.error('tag-suffix parameter is not defined.');
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
  --export-tags <path/to/file>                        Export tags to file.
  --help                                              Display the help.
  --ignore-confirmation                               Ignore the confirmation.
  --manifest-package <manifest-package>               Set the package manifest file location.
  --manifest-plugin <manifest-plugin>                 Set the plugin platform manifest file location.
  --platform-version <platform-version>               Set the platform version.
  --revision <revision>                               Set the revision.
  --tag-suffix <tag-suffix>                           Set the tag suffix.
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
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --revision 02

- Change the platform version
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --platform-version 2.8.0

- Change the plugin version, revision and platform version
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --version 4.5.0

- Change plugin revision and export tags to file
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --export-tags tags.log --revision 02

- Change plugin revision and ignoring the confirmation
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --ignore-confirmation --revision 02

- Change plugin revision and redirect the stdout and stderr to a file
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --ignore-confirmation --revision 02 &> /path/to/create_tags.log

- Change plugin revision, redirect the stdout and stderr to a file and export tags to file
node ${cliFilePath} --manifest-package package.json --manifest-plugin opensearch_dashboards.json --ignore-confirmation --revision 02  --export-tags tags.log &> /path/to/create_tags.log
`);
}

async function question(question) {
  return new Promise(res => {
    const rd = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rd.question(question, input => {
      rd.close();
      res(input);
    });
  });
}

async function requireConfirmation({ ignoreConfirmation }) {
  logger.warn(
    'Ensure the base branches are created in the remote and they have updated the files: ' +
      'README.md, CHANGELOG.md, unit tests files, API data files. ' +
      'It does not modify these files.',
  );

  logger.warn(
    'This script will commit and push the tags to the remote repository, ' +
      'deleting any unpushed changes.',
  );

  if (!ignoreConfirmation) {
    const response = await question('Do you want to continue? [y/N] ');
    if (response.toLowerCase() !== 'y') {
      logger.info('Aborting...');
      process.exit(0);
    }
  }
}

async function run(configuration) {
  let {
    version,
    revision,
    platformVersion,
    tagSuffix,
    exportTagsToFile,
    ignoreConfirmation,
  } = configuration;
  if (!version || !revision) {
    const { version: manifestVersion, revision: manifestRevision } =
      readPackageManifest(configuration.manifestPackage);
    if (!version) {
      logger.warn(
        `version is not defined. Using from the current package manifest ${configuration.manifestPackage}: ${manifestVersion}`,
      );
      configuration.version = version = manifestVersion;
    }
    if (!revision) {
      logger.warn(
        `revision is not defined. Using from the current package manifest ${configuration.manifestPackage}: ${manifestRevision}`,
      );
      configuration.revision = revision = manifestRevision;
    }
  }
  version && logger.info(`Version: ${version}`);
  revision && logger.info(`Revision: ${revision}`);
  platformVersion && logger.info(`Platform version: ${platformVersion}`);
  tagSuffix && logger.info(`Tag suffix: ${tagSuffix}`);
  exportTagsToFile && logger.info(`Export tags to file: ${exportTagsToFile}`);

  const supportedVersions = getSupportedVersions(version);
  logger.info('Supported platforms');
  for (const platformID in supportedVersions) {
    const {
      branch,
      versions: pluginPlatformVersions,
      manifestPluginPath,
    } = supportedVersions[platformID];
    logger.info(
      `Platform: ${platformID} - Base branch: ${branch} - Versions: [${pluginPlatformVersions.join(
        ', ',
      )}] - Manifest plugin path: ${manifestPluginPath}`,
    );
  }

  await requireConfirmation({ ignoreConfirmation });

  const { execSync } = require('child_process');

  function execSystem(command) {
    logger.info(`Run command: ${command}`);
    return execSync(command);
  }

  for (const platformID in supportedVersions) {
    const {
      branch,
      versions: pluginPlatformVersions,
      manifestPluginPath,
    } = supportedVersions[platformID];

    for (const pluginPlatformVersion of pluginPlatformVersions) {
      logger.debug(`Switching to branch: ${branch}`);
      execSystem(`git checkout ${branch}`);
      logger.info(`Switched to branch: ${branch}`);
      logger.debug('Pruning local branches and tags');
      execSystem('git fetch --prune --prune-tags');
      logger.info('Pruned local branches and tags');

      const tag = `v${version}-${pluginPlatformVersion}${tagSuffix}`;
      logger.info(`Generating tag: ${tag}...`);
      logger.info('Calling to bump script');
      const configurationBump = {
        ...configuration,
        manifestPlugin: manifestPluginPath,
        platformVersion: pluginPlatformVersion,
      };
      logger.debug(
        `Configuration to use with the bump script: ${configurationBump}`,
      );

      bump(configurationBump);

      logger.debug('Checking if there are changes to commit');
      const thereChangesToCommit =
        execSystem('git diff --exit-code --no-patch;echo -n $?').toString() ===
        '1';
      logger.debug(`Are there changes to commit?: ${thereChangesToCommit}`);

      if (thereChangesToCommit) {
        logger.info('There are changes to commit.');
        logger.debug('Commiting');
        execSystem(`git commit -am "Bump ${tag}"`);
        logger.info('Commited');
      } else {
        logger.info('There are not changes to commit.');
      }

      logger.debug(`Creating tag: ${tag}`);
      execSystem(
        `git tag -a ${tag} -m "Wazuh ${version} for ${platformID} ${pluginPlatformVersion}"`,
      );
      logger.info(`Created tag: ${tag}`);
      logger.debug(`Pushing tag ${tag} to remote`);
      execSystem(`git push origin ${tag}`);
      logger.info(`Pushed tag ${tag} to remote`);
      logger.debug('Undoing changes');
      execSystem(`git reset --hard origin/${branch}`);
      logger.info('Undone changes');
    }
  }

  if (exportTagsToFile) {
    logger.debug(`Exporting tags to file ${exportTagsToFile}`);
    execSystem(
      `git tag | grep -P -i "^v${version}-.*${tagSuffix}" > ${exportTagsToFile}`,
    );
    logger.info(`Exported tags to file ${exportTagsToFile}`);
  }
}

async function main(input) {
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
      console.error(configuration); // Send to stderr. This does the configuration can be displayed and redirect the stdout output to a file
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

    await run(configuration);
  } catch (error) {
    logger.error(`An unexpected error: ${error}. ${error.stack}`);
    process.exit(1);
  }
}

module.exports = run;

let cliFilePath;

if (require.main === module) {
  cliFilePath = process.argv[1];
  const consoleInputParameters = [...process.argv].slice(2);
  main(consoleInputParameters);
}
