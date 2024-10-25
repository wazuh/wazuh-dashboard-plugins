// Specific process to bump this plugin

const cli = require('../../../../scripts/lib/cli/cli')(
  'plugin-main',
  '',
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
  ],
);

function updateImposterSpecificationReference(configuration, logger) {
  try {
    logger.debug('Editing imposter specification reference');
    const fs = require('fs');
    const path = require('path');
    const specificationFile = path.join(
      __dirname,
      '../../../..',
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

function run(configuration, logger) {
  let localConfiguration = {
    ...configuration,
  };

  if (localConfiguration._unparsed) {
    const { _unparsed, ...rest } = localConfiguration;
    localConfiguration = {
      ...rest,
      ...cli.parse(localConfiguration._unparsed),
    };
  }
  // Set the bump logger level to debug
  if (localConfiguration['debug']) {
    logger.setLevel(0);
  }

  const { execSync } = require('child_process');

  function execSystem(command) {
    logger.info(`Run command: ${command}`);
    return execSync(command);
  }

  if (localConfiguration['plugin-main-generate-api-data-spec']) {
    const path = require('path');
    const rootPluginPath = path.resolve(__dirname, '../../');
    const output = execSystem(
      `cd ${rootPluginPath} && yarn generate:api-data --spec ${localConfiguration['plugin-main-generate-api-data-spec']}`,
    );
    console.log(output.toString());
  } else {
    logger.error(
      'This plugin must update the API data. Use --plugin-main-generate-api-data-spec <plugin-main-generate-api-data-spec> to define the spec URL file.',
    );
    process.exit(1);
  }

  updateImposterSpecificationReference(localConfiguration, logger);
}

const logger = require('../../../../scripts/release/lib/logger').create([
  'bump',
  'plugin-main',
]);

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

    run(configuration, logger);
  } catch (error) {
    logger.error(`An unexpected error: ${error}. ${error.stack}`);
    process.exit(1);
  }
}

module.exports = run;

if (require.main === module) {
  main();
}
