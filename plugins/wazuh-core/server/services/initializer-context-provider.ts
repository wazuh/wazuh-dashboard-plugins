import { PluginInitializerContext } from "opensearch-dashboards/server";
import { CorePluginConfigType } from "..";
import { IConfigurationProvider } from "./configuration-provider";
import { first } from 'rxjs/operators';

export class InitializerConfigProvider implements IConfigurationProvider {
  private config: CorePluginConfigType;

  constructor(private initializerContext: PluginInitializerContext) {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    const config$ = this.initializerContext.config.create<CorePluginConfigType>();
    this.config = await config$.pipe(first()).toPromise();
  }

  async get(key: keyof CorePluginConfigType): Promise<CorePluginConfigType[keyof CorePluginConfigType]> {
    if (!this.config){
      await this.initializeConfig();
    }
    if (!this.config[key]) {
      throw new Error(`Key ${key} not found`);
    }
    return this.config[key];
  }

  async getAll(): Promise<CorePluginConfigType> {
    if (!this.config){
      await this.initializeConfig();
    }
    return this.config;
  }
}