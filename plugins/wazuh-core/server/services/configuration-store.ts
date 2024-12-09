import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
} from '../../common/services/configuration';
import { CacheTTL } from '../../common/services/cache';
import { IConfigurationProvider } from './configuration-provider';

interface IConfigurationStoreOptions {
  cache_seconds: number;
  file: string;
}

interface IStoreGetOptions {
  ignoreCache: boolean;
}

export class ConfigurationStore implements IConfigurationStore {
  private providers: Map<string, IConfigurationProvider>;
  constructor(private logger: Logger, options: IConfigurationStoreOptions) {
    this.providers = new Map();
  }

  registerProvider(name: string, provider: IConfigurationProvider) {
    this.providers.set(name, provider);
  }

  async getConfiguration(key: string): Promise<any> {
    try {
      const provider = this.providers.get(key);
      if (!provider) {
        throw new Error(`Provider ${key} not found`);
      }
      const configuration = await provider.getAll();
      return configuration;
    } catch (error) {
      const enhancedError = new Error(
        `Error getting configuration: ${error.message}`,
      );
      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }
  
  private async storeGet(params?: IStoreGetOptions) {}

  private async storeSet(attributes: any) {}
    

  async setup() {
    this.logger.debug('Setup');
  }
  async start() {
    try {
      this.logger.debug('Start');
    } catch (error) {
      this.logger.error(`Error starting: ${error?.message}`);
    }
  }
  async stop() {
    this.logger.debug('Stop');
  }
  async get(configName: string): Promise<any | { [key: string]: any }> {
     // get all the providers and check if the setting is in any of them
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      try {
        const settings = await provider.getAll();
        if (settings[configName]) {
          return settings[configName];
        }
      } catch (error) {
        this.logger.error(
          `Error getting configuration from ${provider.constructor.name}: ${error.message}`,
        );
      }
    }
    throw new Error(`Configuration ${configName} not found`);
  }
  async set(settings: { [key: string]: any }): Promise<any> {}

  async clear(...settings: string[]): Promise<any> {}

}