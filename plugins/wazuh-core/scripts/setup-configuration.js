/**
 * This script setup the configuration of the Wazuh plugins into a saved object through the
 * API endpoints provided by the plugins. The Wazuh dashboard server needs to be up.
 *
 * If the Wazuh dashboard has the security enabled, it is required to use an administrator user.
 *
 * Features:
 * - Update the settings.
 * - Create API connection. If it already exist an API connection with the same ID, then this could
 *   not be created.
 * - Optionally, clear the current configuration through a script option.
 */

const platformName = 'Wazuh dashboard';
const cliName = 'setup-configuration';
const cliDescription = `Setup the configuration of the plugins into ${platformName} from a configuration file. This requires the ${platformName} server is up.`;

// Create CLI
const cli = require('./lib/cli')(
  cliName,
  cliDescription,
  `node ${__filename} --config-file <path/to/config/file> --host <server-address> [options]`,
  [
    {
      long: 'debug',
      short: 'd',
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
      short: 'h',
      description: 'Display the help.',
      parse: (parameter, input, { logger, option, help }) => {
        help();
        process.exit(0);
      },
    },
    {
      long: 'config-file',
      short: 'f',
      description: 'Define the path to the configuration file.',
      help: '<file-path>',
      required: true,
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
      long: 'host',
      short: 'a',
      description: 'Define the host address.',
      help: '<url>',
      required: true,
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
      short: 'u',
      description: 'Define the username.',
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
      short: 'p',
      description: 'Define the password.',
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
      long: 'clear',
      short: 'c',
      description: 'Clear the previous configuration.',
      parse: (parameter, input, { logger, option }) => {
        logger.setLevel(0);
        return {
          [option.long]: true,
        };
      },
    },
  ],
);

function readConfigFile(path) {
  cli.logger.debug(`Reading file ${path}`);
  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf8');
  cli.logger.debug(`Read file ${path}`);

  cli.logger.debug('Loading file content as JSON');
  const yml = require('js-yaml');
  const configAsJSON = yml.load(content);
  cli.logger.debug(
    `Loaded file content as JSON: ${JSON.stringify(configAsJSON)}`,
  );
  return configAsJSON;
}

function getRequestOptions(configuration) {
  return {
    // Add optionally the auth credentials
    ...(configuration.username && configuration.password
      ? { auth: `${configuration.username}:${configuration.password}` }
      : {}),
    rejectUnauthorized: false,
    headers: {
      'content-type': 'application/json',
      'osd-xsrf': 'kibana',
    },
  };
}

function validateResponseStatusCode(response) {
  if (response.statusCode < 200 || response.statusCode > 200) {
    const bodyJSON =
      typeof response.body === 'string' && JSON.parse(response.body);
    throw new Error(
      (bodyJSON && bodyJSON.message) ||
        `Request failed with status code [${response.statusCode}]`,
    );
  }
  return response;
}

async function clearConfiguration(configuration) {
  try {
    const http = require('./lib/http');
    cli.logger.debug('Clearing configuration');
    const response = await http.client
      .post(
        `${configuration.host}/utils/configuration/clear`,
        getRequestOptions(configuration),
      )
      .then(validateResponseStatusCode);
    cli.logger.debug('Cleared configuration');
  } catch (error) {
    cli.logger.error(`Error clearing the configuration: ${error.message}`);
    process.exit(1);
  }
}

async function updateOtherSettings(configuration, settings) {
  try {
    const http = require('./lib/http');
    cli.logger.debug(`Updating other settings: ${JSON.stringify(settings)}`);
    const response = await http.client
      .put(
        `${configuration.host}/utils/configuration`,
        getRequestOptions(configuration),
        settings,
      )
      .then(validateResponseStatusCode);
    cli.logger.info(`Updated settings: ${response.body}`);
    const jsonResponse = JSON.parse(response.body);

    if (jsonResponse.requiresRestartingPluginPlatform) {
      cli.logger.warn(
        `The ${platformName} needs to be restarted to some settings take effect.`,
      );
    }
  } catch (error) {
    cli.logger.error(`Error updating the configurations: ${error.message}`);
  }
}

async function updateHosts(configuration, hosts) {
  cli.logger.debug(`Updating API hosts: ${JSON.stringify(hosts)}`);
  const http = require('./lib/http');
  for (const key in hosts) {
    const id = Object.keys(hosts[key])[0];
    const host = {
      ...hosts[key][id],
      id: id,
    };
    cli.logger.info(`Updating API host [${host.id}]`);
    try {
      const response = await http.client
        .post(
          `${configuration.host}/hosts/apis/${host.id}`,
          getRequestOptions(configuration),
          host,
        )
        .then(validateResponseStatusCode);
      cli.logger.debug(`Updated API host [${host.id}]: ${response.body}`);

      cli.logger.info(`Updated API host [${host.id}]`);
    } catch (error) {
      cli.logger.error(
        `Error updating API host [${host.id}]: ${error.message}`,
      );
    }
  }
}

async function main() {
  try {
    // Parse
    const configuration = cli.parse([...process.argv].slice(2).join(' '));

    // Display the configuration
    if (configuration['display-configuration']) {
      /* Send to stderr. This does the configuration can be displayed and redirect the stdout output
      to a file */
      console.error(configuration);
    }

    if (configuration.username && !configuration.password) {
      cli.logger.error('Username was defined but not the password');
      process.exit(1);
    }

    if (!configuration.username && configuration.password) {
      cli.logger.error('Password was defined but not the username');
      process.exit(1);
    }

    // Read the configuration file
    const configAsJSON = readConfigFile(configuration['config-file']);

    if (!Object.keys(configAsJSON).length) {
      cli.logger.warn('Config file has not defined settings.');
      process.exit(1);
    }

    // Clear the configuration
    if (configuration['clear']) {
      await clearConfiguration();
    }

    // Separate the configurations
    const { hosts, ...otherSettings } = configAsJSON;

    const thereIsOtherSettings = Object.keys(otherSettings).length;

    if (!thereIsOtherSettings && !hosts) {
      cli.logger.warn(
        'There are not settings defined in the configuration file. Skip.',
      );
      process.exit(1);
    }

    // Update the other settings
    if (thereIsOtherSettings) {
      !configuration['clear'] &&
        cli.logger.warn(
          'This will be update the current configuration with the defined settings in the configuration file, but does not modify already stored settings',
        );
      const filesSettings = Object.keys(otherSettings).filter(key =>
        key.startsWith('customization.logo'),
      );
      if (filesSettings.length) {
        cli.logger.warn(
          `Found some settings related to files: ${filesSettings
            .map(setting => `[${setting}]`)
            .join(
              ', ',
            )}. The setting values will be updated but the file should be stored to the expected location path.`,
        );
      }
      await updateOtherSettings(configuration, otherSettings);
    }

    // Update the hosts
    if (hosts) {
      !configuration['clear'] &&
        cli.logger.warn(
          'This will try to add each defined host. If a host with the same ID already exist, it could not be updated.',
        );
      await updateHosts(configuration, hosts);
    }
  } catch (error) {
    cli.logger.error(error.message);
    process.exit(1);
  }
}

main();
