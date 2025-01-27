const createCLI = require('../lib/cli/cli');
const path = require('path');
const {
  mapTemplateToIndexPatternFields,
} = require('./map-template-to-index-pattern-fields');

const cli = createCLI(
  path.basename(__filename),
  'cliDescription',
  `node ${__filename} --template <template> [options]`,
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
      long: 'template',
      description: 'Define the index template file location.',
      help: '<url/file>',
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
      long: 'output',
      description: 'Define output to a file.',
      help: '<file>',
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

const outputs = {
  stdout: (value, configuration) => console.log(JSON.stringify(value, null, 2)),
  file: (value, configuration) => {
    const filePath = resolveRelativePath(configuration.output);
    require('fs').writeFileSync(filePath, JSON.stringify(value, null, 2));
    cli.logger.info(`Output saved in ${filePath}`);
  },
};

function resolveRelativePath(...relativePath) {
  return path.resolve(process.cwd(), ...relativePath);
}

async function run(input) {
  try {
    const configuration = cli.parse(input);

    if (configuration['debug']) {
      cli.logger.setLevel(0);
    }

    if (configuration['display-configuration']) {
      /* Send to stderr. This does the configuration can be displayed and redirect the stdout output
      to a file */
      console.error(configuration);
    }

    // Display the help
    if (configuration['help']) {
      cli.help();
    }

    let template;

    if (/^https?:\/\//.test(configuration.template)) {
      const request = require('../lib/http');
      const respose = await request({
        method: 'get',
        url: configuration.template,
      });
      template = respose.body;
    } else {
      template = require(resolveRelativePath(configuration.template));
    }

    const fields = mapTemplateToIndexPatternFields(template);

    // // Output
    (configuration.output ? outputs.file : outputs.stdout)(
      fields,
      configuration,
    );
  } catch (error) {
    cli.logger.error(`An unexpected error happened: ${error.message}`);
    process.exit(1);
  }
}

const consoleInputParameters = [...process.argv].slice(2).join(' ');
run(consoleInputParameters);
