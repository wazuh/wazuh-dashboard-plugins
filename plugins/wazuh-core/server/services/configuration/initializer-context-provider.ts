import { PluginInitializerContext } from 'opensearch-dashboards/server';
import { CorePluginConfigType } from '../../index';
import { IConfigurationProvider } from '../../../common/services/configuration/configuration-provider';
import { first } from 'rxjs/operators';
import { EConfigurationProviders } from '../../../common/constants';

export class InitializerConfigProvider implements IConfigurationProvider {
  private config: CorePluginConfigType = {} as CorePluginConfigType;
  private name: string = EConfigurationProviders.INITIALIZER_CONTEXT;

  constructor(
    private initializerContext: PluginInitializerContext<CorePluginConfigType>,
  ) {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    const config$ =
      this.initializerContext.config.create<CorePluginConfigType>();
    this.config = await config$.pipe(first()).toPromise();
  }

  setName(name: string): void {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  async get(
    key: keyof CorePluginConfigType,
  ): Promise<CorePluginConfigType[keyof CorePluginConfigType]> {
    if (!this.config) {
      await this.initializeConfig();
    }
    if (!this.config[key]) {
      throw new Error(`Key ${key} not found`);
    }
    return this.config[key];
  }

  async getAll(): Promise<CorePluginConfigType> {
    if (!this.config) {
      await this.initializeConfig();
    }
    return this.config;
  }
}
