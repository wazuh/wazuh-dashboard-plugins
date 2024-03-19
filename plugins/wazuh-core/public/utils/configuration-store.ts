import {
  TConfigurationSetting,
  IConfigurationStore,
  ILogger,
  IConfiguration,
} from '../../common/services/configuration';

export class ConfigurationStore implements IConfigurationStore {
  private _stored: any;
  constructor(private logger: ILogger) {
    this._stored = {};
  }
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
  private storeGet() {
    return this._stored;
  }
  private storeSet(value: any) {
    this._stored = value;
  }
  async get(...settings: string[]): Promise<any | { [key: string]: any }> {
    const stored = this.storeGet();

    return settings.length
      ? settings.reduce(
          (accum, settingKey: string) => ({
            ...accum,
            [settingKey]: stored[settingKey],
          }),
          {},
        )
      : stored;
  }
  async set(settings: { [key: string]: any }): Promise<any> {
    try {
      const attributes = this.storeGet();
      const newSettings = {
        ...attributes,
        ...settings,
      };
      this.logger.debug(`Updating store with ${JSON.stringify(newSettings)}`);
      const response = this.storeSet(newSettings);
      this.logger.debug('Store was updated');
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
      const response = this.storeSet(updatedSettings);
      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
