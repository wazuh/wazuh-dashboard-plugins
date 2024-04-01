import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
  TConfigurationSetting,
  IConfiguration,
} from '../../common/services/configuration';
import { Encryption } from './encryption';
import { CacheTTL } from '../../common/services/cache';

interface IConfigurationStoreOptions {
  instance: string;
  encryption_key: string;
  cache_seconds: number;
}

interface IStoreGetOptions {
  ignoreCache: boolean;
}

export class ConfigurationStore implements IConfigurationStore {
  private type = 'wazuh-dashboard-plugins-config';
  private savedObjectRepository: any;
  private configuration: IConfiguration;
  private encryption: any;
  private _config: IConfigurationStoreOptions;
  private _cache: CacheTTL<any>;
  private _cacheKey: string;
  constructor(
    private logger: Logger,
    private savedObjects: any,
    options: IConfigurationStoreOptions,
  ) {
    this.encryption = new Encryption(this.logger.get('encryption'), {
      key: options.encryption_key,
    });
    this._config = options;

    /* The ttl cache is used to support sharing configuration through different instances of the
    platfrom */
    this._cache = new CacheTTL<any>(this.logger.get('cache'), {
      ttlSeconds: options.cache_seconds,
    });
    this._cacheKey = 'configuration';
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
  private async storeGet(params?: IStoreGetOptions) {
    try {
      if (!params?.ignoreCache && this._cache.has(null, this._cacheKey)) {
        return this._cache.get(null, this._cacheKey);
      }
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

      // Transform the stored values to raw
      const attributes = Object.fromEntries(
        Object.entries(response.attributes).map(([key, value]) => [
          key,
          this.getSettingValue(key, value),
        ]),
      );

      // Cache the values
      this._cache.set(attributes, this._cacheKey);
      return attributes;
    } catch (error) {
      // Saved object not found
      if (error?.output?.payload?.statusCode === 404) {
        return {};
      }
      throw error;
    }
  }
  private async storeSet(attributes: any) {
    this.logger.debug(
      `Setting saved object [${this.type}:${this._config.instance}]`,
    );
    const enhancedAttributes = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        this.setSettingValue(key, value),
      ]),
    );
    const response = await this.savedObjectRepository.create(
      this.type,
      enhancedAttributes,
      {
        id: this._config.instance,
        overwrite: true,
        refresh: true,
      },
    );
    this.logger.debug(
      `Set saved object [${this.type}:${this._config.instance}]`,
    );
    this._cache.set(attributes, this._cacheKey);
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
      const storeGetOptions =
        settings.length && typeof settings[settings.length - 1] !== 'string'
          ? settings.pop()
          : {};
      this.logger.debug(
        `Getting settings: [${JSON.stringify(
          settings,
        )}] with store get options [${storeGetOptions}]`,
      );
      const stored = await this.storeGet(storeGetOptions);
      return settings.length
        ? settings.reduce(
            (accum, settingKey: string) => ({
              ...accum,
              [settingKey]: stored?.[settingKey],
            }),
            {},
          )
        : stored;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async set(settings: { [key: string]: any }): Promise<any> {
    try {
      this.logger.debug('Updating saved object');
      const stored = await this.storeGet({ ignoreCache: true });

      const newSettings = {
        ...stored,
        ...settings,
      };
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
      const stored = await this.storeGet({ ignoreCache: true });
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
