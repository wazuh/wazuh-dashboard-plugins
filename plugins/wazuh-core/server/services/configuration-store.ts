import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
  TConfigurationSetting,
} from '../../common/services/configuration';

export class ConfigurationStore implements IConfigurationStore {
  private type = 'plugins-configuration';
  private savedObjectRepository: any;
  constructor(private logger: Logger, private savedObjects) {}
  private getSavedObjectDefinition(settings: {
    [key: string]: TConfigurationSetting;
  }) {
    return {
      name: this.type,
      hidden: false,
      namespaceType: 'agnostic',
      mappings: {
        properties: Object.entries(settings).reduce(
          (accum, [key, value]) => ({
            ...accum,
            ...(value?.persistence?.savedObject?.mapping
              ? { [key]: value.persistence.savedObject.mapping }
              : {}),
          }),
          {},
        ),
      },
    };
  }
  async setSavedObjectRepository(savedObjectRepository) {
    this.savedObjectRepository = savedObjectRepository;
  }
  async setup(settings: { [key: string]: TConfigurationSetting }) {
    // Register the saved object
    try {
      this.logger.debug('Setup');
      const savedObjectSchema = this.getSavedObjectDefinition(settings);
      this.logger.info(`Schema: ${JSON.stringify(savedObjectSchema)}`);
      await this.savedObjects.registerType(savedObjectSchema);
      this.logger.info('Schema registered');
    } catch (error) {
      this.logger.error(error.message);
    }
  }
  async start() {}
  async stop() {}
  async get(...settings: string[]): Promise<any | { [key: string]: any }> {
    try {
      const { attributes } = await this.savedObjectRepository.get(
        this.type,
        this.type,
      );
      return settings.length
        ? settings.reduce(
            (accum, settingKey: string) => ({
              ...accum,
              [settingKey]: attributes[settingKey],
            }),
            {},
          )
        : attributes;
    } catch (error) {
      return {};
    }
  }
  async set(settings: { [key: string]: any }): Promise<any> {
    try {
      const attributes = await this.get();
      const newSettings = {
        ...attributes,
        ...settings,
      };
      this.logger.debug(
        `Updating saved object with ${JSON.stringify(newSettings)}`,
      );
      const response = await this.savedObjectRepository.create(
        this.type,
        newSettings,
        {
          id: this.type,
          overwrite: true,
          refresh: true,
        },
      );
      this.logger.debug('Saved object was updated');
      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async clean(...settings: string[]): Promise<any> {
    try {
      const attributes = await this.get();
      const updatedSettings = {
        ...attributes,
      };
      settings.forEach(setting => delete updatedSettings[setting]);
      const response = await this.savedObjectRepository.create(
        this.type,
        updatedSettings,
        {
          id: this.type,
          overwrite: true,
          refresh: true,
        },
      );
      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
