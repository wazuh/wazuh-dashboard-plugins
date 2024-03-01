import fs from 'fs';
import path from 'path';

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

      logger.debug(`Importing file [${configurationFileLocation}]`);
      const responseImportFile = await configuration.importFile(content);
      logger.info(`Imported file [${configurationFileLocation}]`);

      responseImportFile?.warnings?.forEach?.((warning: string) =>
        logger.warn(warning),
      );
    } catch (error) {
      logger.error(`Error migrating the configuration file: ${error.message}`);
    }
  },
};
