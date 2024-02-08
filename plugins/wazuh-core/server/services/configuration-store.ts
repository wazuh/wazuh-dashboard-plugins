import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
  TConfigurationSetting,
  IConfiguration,
} from '../../common/services/configuration';
import { Encryption } from './encryption';

interface IConfigurationStoreOptions {
  instance: string;
  encryption_password: string;
}
export class ConfigurationStore implements IConfigurationStore {
  private type = 'plugins-configuration';
  private savedObjectRepository: any;
  private configuration: IConfiguration;
  private encryption: any;
  private _config: IConfigurationStoreOptions;
  constructor(
    private logger: Logger,
    private savedObjects,
    options: IConfigurationStoreOptions,
  ) {
    this.encryption = new Encryption(this.logger.get('encryption'), {
      password: options.encryption_password,
    });
    this._config = options;
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
      ? JSON.parse(this.encryption.decrypt(value))
      : value;
  }
  setSettingValue(key: string, value: any) {
    const setting = this.configuration._settings.get(key);
    return setting?.store?.savedObject?.encrypted
      ? this.encryption.encrypt(JSON.stringify(value))
      : value;
  }
  private async storeGet() {
    try {
      this.logger.debug(
        `Fetching saved object [${this.type}:${this._config.instance}]`,
      );
      const response = await this.savedObjectRepository.get(
        this.type,
        this._config.instance,
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
    const response = await this.savedObjectRepository.create(this.type, store, {
      id: this._config.instance,
      overwrite: true,
      refresh: true,
    });
    return response.attributes;
  }
  async savedObjectIsCreated() {
    try {
      this.logger.debug(
        `Fetching saved object is created [${this.type}:${this._config.instance}]`,
      );
      const response = await this.savedObjectRepository.get(
        this.type,
        this._config.instance,
      );
      this.logger.debug(
        `Fetched saved object  is created response [${JSON.stringify(
          response,
        )}]`,
      );
      return true;
    } catch (error) {
      // Saved object not found
      if (error?.output?.payload?.statusCode === 404) {
        return false;
      }
      throw error;
    }
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

      const newSettings = Object.fromEntries(
        Object.entries({
          ...stored,
          ...settings,
        }).map(([key, value]) => [key, this.setSettingValue(key, value)]),
      );
      this.logger.debug(
        `Updating saved object with ${JSON.stringify(newSettings)}`,
      );
      await this.storeSet(newSettings);
      this.logger.debug('Saved object was updated');
      return settings;
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
      const removedSettings = {};
      settings.forEach(setting => {
        delete updatedSettings[setting];
        removedSettings[setting] = null;
      });
      await this.storeSet(updatedSettings);
      return removedSettings;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
