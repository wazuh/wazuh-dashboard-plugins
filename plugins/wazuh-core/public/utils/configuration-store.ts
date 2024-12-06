import {
  IConfigurationStore,
  Logger,
  IConfiguration,
} from '../../common/services/configuration';

export class ConfigurationStore implements IConfigurationStore {
  private stored: any;
  file = '';
  configuration: IConfiguration | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly http: any,
  ) {
    this.stored = {};
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
    return this.stored;
  }

  private storeSet(value: any) {
    this.stored = value;
  }

  async get(...settings: string[]): Promise<any | Record<string, any>> {
    const stored = this.storeGet();

    return settings.length > 0
      ? Object.fromEntries(
          settings.map((settingKey: string) => [
            settingKey,
            stored[settingKey],
          ]),
        )
      : stored;
  }

  async set(settings: Record<string, any>): Promise<any> {
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

      for (const setting of settings) {
        delete updatedSettings[setting];
      }

      const response = this.storeSet(updatedSettings);

      return response;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
