const cliName = 'migrate-config-file';
const cliDescription =
  'Migrate the configuration from the configuration file to the saved object. This requires the server is up.';

const platformName = 'Wazuh dashboard';

// Create CLI
const cli = require('./lib/cli')(
  cliName,
  cliDescription,
  `node ${__filename} --config-file <path/to/config/file> --host <server-address> [options]`,
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
      parse: (parameter, input, { logger, option, help }) => {
        help();
        process.exit(0);
        return {
          [option.long]: true,
        };
      },
    },
    {
      long: 'config-file',
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
      long: 'user',
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

async function clearConfiguration() {
  try {
    const http = require('./lib/http');
    cli.logger.debug('Clearing configuration');
    const response = await http.client.post(
      `${configuration.host}/utils/configuration/clear`,
      {
        rejectUnauthorized: false,
        headers: {
          'content-type': 'application/json',
          'osd-xsrf': 'kibana',
        },
      },
    );
    cli.logger.debug('Cleared configuration');
  } catch (error) {
    cli.logger.error(error.message);
  }
}

async function updateOtherSettings(configuration, settings) {
  try {
    const http = require('./lib/http');
    cli.logger.debug(`Updating other settings: ${JSON.stringify(settings)}`);
    const response = await http.client.put(
      `${configuration.host}/utils/configuration`,
      {
        rejectUnauthorized: false,
        headers: {
          'content-type': 'application/json',
          'osd-xsrf': 'kibana',
        },
      },
      settings,
    );
    cli.logger.info(`Updated settings: ${response}`);
    const jsonResponse = JSON.parse(response);

    if (jsonResponse.requiresRestartingPluginPlatform) {
      cli.logger.warn(
        `The ${platformName} needs to be restarted to some settings take effect.`,
      );
    }
  } catch (error) {
    cli.logger.error(error.message);
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
      const response = await http.client.put(
        `${configuration.host}/hosts/apis/${host.id}`,
        {
          rejectUnauthorized: false,
          headers: {
            'content-type': 'application/json',
            'osd-xsrf': 'kibana',
          },
        },
        host,
      );
      cli.logger.debug(`Updated API host [${host.id}]: ${response}`);

      cli.logger.info(`Updated API host [${host.id}]`);
    } catch (error) {
      cli.logger.error(error.message);
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
    await clearConfiguration();
    // Migrate the configuration

    // Separate the configurations
    const { hosts, ...otherSettings } = configAsJSON;

    if (otherSettings || hosts) {
      cli.logger.warn(
        'This will be update the settings defined in the configuration file, but does not modify or reset the undefined settings.',
      );
    }

    // Update the other settings
    if (otherSettings) {
      const filesSettings = Object.keys(otherSettings).filter(key =>
        key.startsWith('customization.logo'),
      );
      if (filesSettings.length) {
        cli.logger.warn(
          `Found some settings related to files: ${filesSettings
            .map(setting => `[${setting}]`)
            .join(
              ', ',
            )}. The setting values will be updated but the file should be moved to the expected location path.`,
        );
      }
      await updateOtherSettings(configuration, otherSettings);
    }

    // Update the hosts
    if (hosts) {
      await updateHosts(configuration, hosts);
    }
  } catch (error) {
    cli.logger.error(error.message);
    process.exit(1);
  }
}

main();
