import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
  TConfigurationSetting,
  IConfiguration,
} from '../../common/services/configuration';
import { Encryptation } from './encryptation';

export class ConfigurationStore implements IConfigurationStore {
  private type = 'plugins-configuration';
  private savedObjectRepository: any;
  private configuration: IConfiguration;
  private encryptation: any;
  constructor(private logger: Logger, private savedObjects, options) {
    this.encryptation = new Encryptation(this.logger.get('encryptation'), {
      password: options.encryptation_password,
    });
  }
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
            ...(value?.store?.savedObject?.mapping
              ? { [key]: value.store.savedObject.mapping }
              : {}),
          }),
          {},
        ),
      },
    };
  }
  setSavedObjectRepository(savedObjectRepository) {
    this.savedObjectRepository = savedObjectRepository;
  }
  setConfiguration(configuration: IConfiguration) {
    this.configuration = configuration;
  }
  getSettingValue(key: string, value: any) {
    const setting = this.configuration._settings.get(key);
    return setting?.store?.savedObject?.encrypted
      ? JSON.parse(this.encryptation.decrypt(value))
      : value;
    return (
      setting?.store?.savedObject?.get?.(value, {
        encryptation: this.encryptation,
      }) ?? value
    );
  }
  setSettingValue(key: string, value: any) {
    const setting = this.configuration._settings.get(key);
    return setting?.store?.savedObject?.encrypted
      ? this.encryptation.encrypt(JSON.stringify(value))
      : value;
    return (
      setting?.store?.savedObject?.set?.(value, {
        encryptation: this.encryptation,
      }) ?? value
    );
  }
  private async storeGet() {
    try {
      this.logger.debug(`Fetching saved object [${this.type}:${this.type}]`);
      const response = await this.savedObjectRepository.get(
        this.type,
        this.type,
      );
      this.logger.debug(
        `Fetched saved object response [${JSON.stringify(response)}]`,
      );
      return response.attributes;
    } catch (error) {
      // Saved object not found
      if (error?.output?.payload?.statusCode === 404) {
        return {};
      }
      throw error;
    }
  }
  private async storeSet(store: any) {
    return await this.savedObjectRepository.create(this.type, store, {
      id: this.type,
      overwrite: true,
      refresh: true,
    });
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
      const stored = await this.storeGet();
      return settings.length
        ? settings.reduce(
            (accum, settingKey: string) => ({
              ...accum,
              [settingKey]: this.getSettingValue(
                settingKey,
                stored[settingKey],
              ),
            }),
            {},
          )
        : Object.fromEntries(
            Object.entries(stored).map(([key, value]) => [
              key,
              this.getSettingValue(key, value),
            ]),
          );
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async set(settings: { [key: string]: any }): Promise<any> {
    try {
      this.logger.debug('Updating saved object');
      const stored = await this.get();
      const newSettings = {
        ...stored,
        ...Object.fromEntries(
          Object.entries(settings).map(([key, value]) => [
            key,
            this.setSettingValue(key, value),
          ]),
        ),
      };
      this.logger.debug(
        `Updating saved object with ${JSON.stringify(newSettings)}`,
      );
      const response = await this.storeSet(newSettings);
      this.logger.debug('Saved object was updated');
      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async clear(...settings: string[]): Promise<any> {
    try {
      const stored = await this.get();
      const updatedSettings = {
        ...stored,
      };
      settings.forEach(setting => delete updatedSettings[setting]);
      const response = await this.storeSet(updatedSettings);
      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
