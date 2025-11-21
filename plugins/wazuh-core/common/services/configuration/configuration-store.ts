import { Logger } from 'opensearch-dashboards/server';
import { IConfigurationStore } from './types';
import { IConfigurationProvider } from './configuration-provider';

export class ConfigurationStore implements IConfigurationStore {
  private readonly providers: Map<string, IConfigurationProvider>;

  constructor(private readonly logger: Logger) {
    this.providers = new Map();
  }

  registerProvider(name: string, provider: IConfigurationProvider) {
    if (!provider) {
      // ToDo: Create custom error and implement error handling
      throw new Error('Provider is required');
    }

    provider.setName(name);
    this.providers.set(name, provider);
  }

  getProvider(name: string): IConfigurationProvider {
    const provider = this.providers.get(name);

    if (!provider) {
      // ToDo: Create custom error and implement error handling
      throw new Error(`Provider ${name} not found`);
    }

    return provider;
  }

  async getProviderConfiguration(key: string): Promise<Record<string, any>> {
    try {
      const provider = this.providers.get(key);

      if (!provider) {
        // ToDo: Create custom error and implement error handling
        throw new Error(`Provider ${key} not found`);
      }

      const configuration = await provider.getAll();

      return configuration;
    } catch (error) {
      const errorCasted = error as Error;
      // ToDo: Create custom error and implement error handling
      const enhancedError = new Error(
        `Error getting configuration: ${errorCasted?.message}`,
      );

      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }

  async setup(_dependencies: any = {}) {
    this.logger.debug('Setup');
  }

  async start() {
    try {
      this.logger.debug('Start');
    } catch (error) {
      const errorCasted = error as Error;

      this.logger.error(`Error starting: ${errorCasted?.message}`);
    }
  }

  async stop() {
    this.logger.debug('Stop');
  }

  async get(configName: string): Promise<any | Record<string, any>> {
    // get all the providers and check if the setting is in any of them
    const configuration = await this.getAll();

    // check if the configName exist in the object
    if (Object.keys(configuration).includes(configName)) {
      return configuration[configName];
    }

    // ToDo: Create custom error and implement error handling
    throw new Error(`Configuration ${configName} not found`);
  }

  async getAll(): Promise<Record<string, any>> {
    const providers = [...this.providers.values()];
    const configurations = await Promise.all(
      providers.map(async provider => {
        try {
          return await provider.getAll();
        } catch (error) {
          const errorCasted = error as Error;

          this.logger.error(
            `Error getting configuration from ${provider.constructor.name}: ${errorCasted?.message}`,
          );

          return {};
        }
      }),
    );
    const result: Record<string, any> = {};

    for (const config of configurations) {
      for (const key of Object.keys(config)) {
        if (result[key] === undefined) {
          result[key] = config[key];
        }
      }
    }

    return result;
  }
}
