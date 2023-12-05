// NodeJS script which bumps the plugins and create the tag in the remote repository.
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
//   2.5. Run the specific bump task.
// 3. Commit (optional)
// 4. Create tag
// 5. Push tag
// 6. Reset local branch to remote branch
// 3. Optional. Export tags to file

const cliName = 'tag';
const cliDescription = `Bump the plugins and create the tag in the remote repository.
Some warning messages are sent to stderr.`;

const logger = require('./lib/logger').create(['tag']);
const { readPackageManifest } = require('./lib/read-manifest-package');
const bump = require('./bump');
const { question } = require('../lib/cli/question');

async function run(configuration) {
  let {
    version,
    revision,
    'platform-version': platformVersion,
    'tag-suffix': tagSuffix,
    'ignore-configurmation': ignoreConfirmation,
  } = configuration;
  /* If version, revision or platform version are not provided, then try to use the provided
    package manifest file from a plugin.
  */
  if (!version || !revision || !platformVersion) {
    // Read the package manifest file from plugin
    const {
      version: manifestVersion,
      revision: manifestRevision,
      pluginPlatform: { version: manifestPlatformVersion },
    } = readPackageManifest(configuration['manifest-package'], logger);
    if (!version) {
      logger.warn(
        `version is not defined. Using from the current package manifest ${configuration['manifest-package']}: ${manifestVersion}`,
      );
      configuration.version = version = manifestVersion;
    }
    if (!revision) {
      logger.warn(
        `revision is not defined. Using from the current package manifest ${configuration['manifest-package']}]: ${manifestRevision}`,
      );
      configuration.revision = revision = manifestRevision;
    }
    if (!platformVersion) {
      logger.warn(
        `platform version is not defined. Using from the current package manifest ${configuration['manifest-package']}: ${manifestPlatformVersion}`,
      );
      configuration['platform-version'] = platformVersion =
        manifestPlatformVersion;
    }
  }
  version && logger.info(`Version: ${version}`);
  revision && logger.info(`Revision: ${revision}`);
  platformVersion && logger.info(`Platform version: ${platformVersion}`);
  tagSuffix && logger.info(`Tag suffix: ${tagSuffix}`);

  const branch = version;

  logger.warn(
    'Ensure the base branch is created in the remote and it has updated the files that are not ' +
      'modified by the bump process. See RELEASING.md.',
  );

  logger.warn(
    'This script will prune the local branches and tags, bump the plugins, commit and push the ' +
      'tags to the remote repository, deleting any unpushed changes. It is required you have ' +
      'configurated the repository to sign the commit and tag creation.',
  );

  if (!ignoreConfirmation) {
    const response = await question('Do you want to continue? [y/N] ');
    if (response.toLowerCase() !== 'y') {
      logger.info('Aborting...');
      process.exit(0);
    }
  }

  const { execSync } = require('child_process');

  function execSystem(command) {
    logger.info(`Run command: ${command}`);
    return execSync(command);
  }

  logger.debug(`Switching to branch: ${branch}`);
  execSystem(`git checkout ${branch}`);
  logger.info(`Switched to branch: ${branch}`);
  logger.debug('Pruning local branches and tags');
  execSystem('git fetch --prune --prune-tags --force');
  logger.info('Pruned local branches and tags');

  const tag = `v${version}-${platformVersion}${tagSuffix ? tagSuffix : ''}`;
  logger.info(`Generating tag: ${tag}...`);

  bump(configuration);

  if (!ignoreConfirmation) {
    let repeat = true;
    do {
      const response = await question(
        'Review the changes done with the bump. y (continue), d (list changes: git diff), f (list modified files: git diff --name-only), N/n (cancel) ',
      );
      switch (response.toLowerCase()) {
        case 'd': {
          const output = execSystem('git diff');
          console.log(output.toString());
          break;
        }
        case 'f': {
          const output = execSystem('git diff --name-only');
          console.log(output.toString());
          break;
        }
        case 'y': {
          repeat = false;
          break;
        }
        default: {
          logger.warn(
            'Some files could have been changed. You should undone this changes as necessary',
          );
          logger.info('Aborting...');
          process.exit(0);
          break;
        }
      }
    } while (repeat);
  }

  logger.debug('Checking if there are changes to commit');
  const thereChangesToCommit =
    execSystem('git diff --exit-code --no-patch;echo -n $?').toString() === '1';
  logger.debug(`Are there changes to commit?: ${thereChangesToCommit}`);

  if (thereChangesToCommit) {
    logger.info('There are changes to commit.');
    console.log(execSystem('git diff --name-only').toString());
    logger.debug('Commiting');
    execSystem(`git commit -S -am "Bump ${tag}"`);
    logger.info('Commited');
  } else {
    logger.info('There are not changes to commit.');
  }

  logger.debug(`Creating tag: ${tag}`);
  execSystem(
    `git tag -s -a ${tag} -m "Wazuh plugins for Wazuh dashboard ${tag}"`,
  );
  logger.info(`Created tag: ${tag}`);
  logger.debug(`Pushing tag ${tag} to remote`);
  execSystem(`git push origin ${tag}`);
  logger.info(`Pushed tag ${tag} to remote`);
  logger.debug('Undoing changes');
  execSystem(`git reset --hard origin/${branch}`);
  logger.info('Undone changes.');
  thereChangesToCommit &&
    logger.warn(
      `A commit was added to the tag, but the branch ${branch} was reset to the state of the ` +
        'remote.',
    );
}

const cli = require('../lib/cli/cli')(
  cliName,
  cliDescription,
  `node ${__filename} [options]`,
  [
    {
      long: 'debug',
      description: 'Enable debug in the logger.',
      parse: (parameter, input, { logger, option }) => {
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
      long: 'ignore-confirmation',
      description: 'Ignore the confirmation.',
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
      long: 'tag-suffix',
      description: 'Set the tag suffix',
      help: '<suffix>',
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
  ],
);

async function main() {
  try {
    const consoleInputParameters = [...process.argv].slice(2).join(' ');

    const configuration = cli.parse(consoleInputParameters);

    // Display the configuration
    if (configuration['display-configuration']) {
      console.error(configuration); // Send to stderr. This does the configuration can be displayed and redirect the stdout output to a file
    }

    // Display the help
    if (configuration['help']) {
      cli.help();
    }

    if (configuration['debug']) {
      logger.setLevel(0);
    }

    await run(configuration);
  } catch (error) {
    logger.error(`An unexpected error: ${error}. ${error.stack}`);
    process.exit(1);
  }
}

module.exports = run;

if (require.main === module) {
  main();
}
