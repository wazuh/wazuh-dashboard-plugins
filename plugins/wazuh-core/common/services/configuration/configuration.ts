import { IConfiguration, IConfigurationStore, ILogger } from './types';

export class Configuration implements IConfiguration {
  store: IConfigurationStore | null = null;

  constructor(
    private readonly logger: ILogger,
    store: IConfigurationStore,
  ) {
    this.setStore(store);
  }

  setStore(store: IConfigurationStore) {
    this.logger.debug('Setting store');
    this.store = store;
  }

  async setup(_dependencies: any = {}) {
    this.logger.debug('Setup configuration service');

    return this.store?.setup();
  }

  async start(_dependencies: any = {}) {
    this.logger.debug('Start configuration service');

    return this.store?.start();
  }

  async stop(_dependencies: any = {}) {
    this.logger.debug('Stop configuration service');

    return this.store?.stop();
  }

  async get(settingKey: string) {
    return this.store?.get(settingKey);
  }

  async getAll() {
    return (await this.store?.getAll()) || {};
  }
}
