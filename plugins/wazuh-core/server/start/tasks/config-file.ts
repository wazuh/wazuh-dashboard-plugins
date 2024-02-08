import fs from 'fs';
import path from 'path';
import yml from 'js-yaml';

export default {
  name: 'migration-config-file',
  start: async ({ logger, configuration, configurationStore }) => {
    try {
      logger.debug('Migrate configuration file');

      logger.debug(
        'Checking if there are previous configuration stored in the saved object',
      );
      const savedObjectIsCreated =
        await configurationStore.savedObjectIsCreated();

      logger.debug(
        `${
          savedObjectIsCreated ? 'There is' : 'There is not'
        } previous configuration stored in the saved object`,
      );

      const configurationFileLocation = path.join(
        __dirname,
        '../../../../../data/wazuh/config/wazuh.yml',
      );

      logger.debug(
        `Check if the configuration file exists at [${configurationFileLocation}]`,
      );
      if (!fs.existsSync(configurationFileLocation)) {
        logger.debug('Configuration file not found. Skip.');
        return;
      }
      logger.debug(
        `Configuration file found at [${configurationFileLocation}]`,
      );

      if (savedObjectIsCreated) {
        logger.info(
          `The saved object exists so the configuration defined at the file [${configurationFileLocation}] will not be migrated. Skip.`,
        );
        return;
      }

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

      if (!Object.keys(configAsJSON).length) {
        logger.warn(
          `File [${configurationFileLocation}] has not defined settings. Skip.`,
        );
        return;
      }

      logger.debug('Clearing configuration');
      await configuration.clear();
      logger.info('Cleared configuration');

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
    } catch (error) {
      logger.error(error.message);
    }
  },
};
