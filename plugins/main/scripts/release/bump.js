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
      description: 'Generate API data',
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
