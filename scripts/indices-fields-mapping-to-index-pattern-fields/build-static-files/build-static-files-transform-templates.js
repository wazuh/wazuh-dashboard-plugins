const path = require('path');
const { execSync } = require('child_process');
const createCLI = require('../../lib/cli/cli');
const { getTemplatesURLs } = require('./lib');

const cli = createCLI(
  path.basename(__filename),
  'This tool generates the index pattern fields for the Wazuh indices based on the template definition [wazuh/wazuh-indexer-plugins] repository applying a local transformation.',
  `node ${__filename} --branch <branch> [options]`,
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
      long: 'help',
      description: 'Display the help.',
      parse: (parameter, input, { logger, option }) => {
        return {
          [option.long]: true,
        };
      },
    },
    {
      long: 'branch',
      description:
        'Define the branch to retrieve the templates from Wazuh indexer.',
      help: '<branch>',
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

function run(configuration) {
  const templateURLs = getTemplatesURLs({ branch: configuration.branch });
  const pathCli = path.resolve(__dirname, '..', 'cli.js');

  for (const { name, url } of templateURLs) {
    execSync(
      `node ${pathCli} --template ${url} --output ${path.join(configuration['output-dir'], `fields-${name}.json`)}`,
    );
  }
}

function main(input) {
  try {
    let configuration = cli.parse(input);

    configuration = {
      // Default values
      branch: 'master',
      'output-dir': path.join(
        __dirname,
        '../../../plugins/wazuh-core/server/initialization/index-patterns-fields',
      ),
      ...configuration,
    };

    if (configuration['display-configuration']) {
      /* Send to stderr. This does the configuration can be displayed and redirect the stdout output
      to a file */
      console.error(configuration);
    }

    // Display the help
    if (configuration['help']) {
      cli.help();
    }

    run(configuration);
  } catch (error) {
    cli.logger.error(`An unexpected error happened: ${error.message}`);
    process.exit(1);
  }
}

const consoleInputParameters = [...process.argv].slice(2).join(' ');
main(consoleInputParameters);
