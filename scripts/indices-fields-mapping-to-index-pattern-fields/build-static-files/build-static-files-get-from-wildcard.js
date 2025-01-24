const path = require('path');
const { execSync } = require('child_process');
const createCLI = require('../../lib/cli/cli');
const { getTemplatesURLs } = require('./lib');

const cli = createCLI(
  path.basename(__filename),
  'This tool generates the index pattern fields for the Wazuh indices based on the template definition [wazuh/wazuh-indexer-plugins] repository, indexes the template, creates an empty index, gets the fields for wildcard and save into a file. Require a Wazuh dashboard and Wazuh indexer.',
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
    {
      long: 'username',
      description: 'Define Wazuh indexer username.',
      help: '<username>',
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
      long: 'password',
      description: 'Define Wazuh indexer password.',
      help: '<password>',
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
      long: 'wazuh-dashboard',
      description: 'Define Wazuh dashboard address',
      help: '<wazuh-dashboard-url>',
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
      long: 'wazuh-indexer',
      description: 'Define Wazuh indexer address',
      help: '<wazuh-indexer-url>',
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

function createTmpDirectories() {
  ['index-pattern-fields', 'templates'].forEach(dir =>
    execSync(`mkdir -p ${dir}`),
  );
}

function cleanTmpDirectories() {
  ['index-pattern-fields', 'templates'].forEach(dir =>
    execSync(`rm -rf  ${dir}`),
  );
}

function run(configuration) {
  try {
    const templateURLs = getTemplatesURLs({ branch: configuration.branch });

    createTmpDirectories();

    const outputDir = path.join(
      __dirname,
      '../../../plugins/wazuh-core/server/initialization/index-patterns-fields',
    );

    for (const { name, url } of templateURLs) {
      const templateFile = `templates/index-template-${name}.json`;
      const logger = cli.logger.create([name]);
      logger.debug(`Fetching template from ${url}`);

      execSync(`curl -o ${templateFile} ${url}`);
      logger.info(`Fetched template from ${url}`);

      logger.debug(`Indexing template ${url}`);
      execSync(
        `curl -k -u ${configuration.username}:${configuration.password} -XPUT ${configuration['wazuh-indexer']}/_template/${name} -H 'Content-Type: application/json' --data '@${templateFile}'`,
      );
      logger.info(`Indexed template ${url}`);

      const template = require(`./${templateFile}`);

      const [indexNameTemplate] = template.index_patterns;

      const indexName = indexNameTemplate.replace(/\*/g, '');

      logger.debug(`Creating index ${indexName}`);
      execSync(
        `curl -k -u ${configuration.username}:${configuration.password} -XPUT ${configuration['wazuh-indexer']}/${indexName}`,
      );
      logger.info(`Created index ${indexName}`);

      logger.debug(
        `Getting index pattern fields from wildcard ${indexNameTemplate}`,
      );
      execSync(
        `curl -k -u ${configuration.username}:${configuration.password} '${configuration['wazuh-dashboard']}/api/index_patterns/_fields_for_wildcard?pattern=${indexNameTemplate}&meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index&meta_fields=_score' | jq .fields > ${path.join('index-pattern-fields', `fields-${name}.json`)}`,
      );
      logger.info(
        `Get index pattern fields from wildcard ${indexNameTemplate}`,
      );
    }
    cli.logger.debug(`Moving fields files to ${outputDir}/`);
    // execSync(`mv index-pattern-fields/* ${outputDir}/`);
    cli.logger.info(`Moved fields files to ${outputDir}/`);

    // cleanTmpDirectories();
  } catch (error) {
    // cleanTmpDirectories();
    throw error;
  }
}

async function main(input) {
  try {
    let configuration = cli.parse(input);

    configuration = {
      // Default values
      branch: 'master',
      'wazuh-dashboard': 'https://localhost:5601',
      'wazuh-indexer': 'https://localhost:9200',
      username: 'admin',
      password: 'admin',
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
