import {
  IConfigurationStore,
  ILogger,
  IConfiguration,
} from '../../common/services/configuration';

export class ConfigurationStore implements IConfigurationStore {
  private _stored: any;
  file: string = '';
  configuration: IConfiguration | null = null;
  constructor(private logger: ILogger, private http: any) {
    this._stored = {};
  }
  setConfiguration(configuration: IConfiguration) {
    this.configuration = configuration;
  }
  async setup() {
    this.logger.debug('Setup');
  }
  async start() {
    try {
      this.logger.debug('Start');
      const response = await this.http.get('/api/setup');
      this.file = response.data.configuration_file;
    } catch (error) {
      this.logger.error(`Error on start: ${error.message}`);
    }
  }
  async stop() {
    this.logger.debug('Stop');
  }
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
