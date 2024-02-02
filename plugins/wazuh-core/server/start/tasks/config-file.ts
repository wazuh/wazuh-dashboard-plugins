import fs from 'fs';
import path from 'path';
import yml from 'js-yaml';

export default {
  name: 'migration-config-file',
  start: async ({ logger, configuration }) => {
    try {
      logger.debug('Migrate configuration file');

      const configurationFileLocation = path.join(
        __dirname,
        '../../../../../data/wazuh/config/wazuh.yml',
      );
      const backupConfigurationFileLocation = `${configurationFileLocation}.backup`;

      logger.info(configurationFileLocation);
      logger.debug(
        `Check if the configuration file exists at [${configurationFileLocation}]`,
      );
      if (!fs.existsSync(configurationFileLocation)) {
        logger.debug('Configuration file not found. Skipping.');
        return;
      }
      logger.debug(
        `Configuration file found at [${configurationFileLocation}]`,
      );

      logger.debug(`Reading file [${configurationFileLocation}]`);
      const content = fs.readFileSync(configurationFileLocation, 'utf8');
      logger.debug(`Read file [${configurationFileLocation}]`);

      logger.debug(
        `Loading file [${configurationFileLocation}] content as JSON`,
      );

      const configAsJSON = yml.load(content);
      logger.debug(
        `Loaded file [${configurationFileLocation}] content as JSON: ${JSON.stringify(
          configAsJSON,
        )}`,
      );

      if (configAsJSON.hosts) {
        logger.debug(
          `Transforming hosts: ${JSON.stringify(configAsJSON.hosts)}`,
        );
        configAsJSON.hosts = configAsJSON.hosts.map(host => {
          const id = Object.keys(host)[0];
          const data = host[id];
          data.id = id;
          return data;
        }, {});
        logger.debug(
          `Transformed hosts: ${JSON.stringify(configAsJSON.hosts)}`,
        );
      }

      logger.debug('Setting configuration');
      const result = await configuration.set(configAsJSON);
      logger.info('Configuration was updated!');

      logger.debug(
        `Renaming the configuration file from [${configurationFileLocation}] to [${backupConfigurationFileLocation}]`,
      );
      fs.renameSync(configurationFileLocation, backupConfigurationFileLocation);
      logger.info(
        `Renamed the configuration file from [${configurationFileLocation}] to [${backupConfigurationFileLocation}] to avoid an update the following time the job runs.`,
      );
    } catch (error) {
      logger.error(error.message);
    }
  },
};
