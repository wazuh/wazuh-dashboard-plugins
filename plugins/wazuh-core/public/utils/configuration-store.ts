import {
  TConfigurationSetting,
  IConfigurationStore,
  ILogger,
  IConfiguration,
} from '../../common/services/configuration';

export class ConfigurationStore implements IConfigurationStore {
  constructor(private logger: ILogger) {}
  async setup(settings: { [key: string]: TConfigurationSetting }) {
    try {
      this.logger.debug('Setup');
    } catch (error) {
      this.logger.error(error.message);
    }
  }
  setConfiguration(configuration: IConfiguration) {
    this.configuration = configuration;
  }
  async start() {}
  async stop() {}
  async fetch() {}
  async get(...settings: string[]): Promise<any | { [key: string]: any }> {
    const { attributes = {} } = await this.savedObjectRepository.get(
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
  async clear(...settings: string[]): Promise<any> {
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
