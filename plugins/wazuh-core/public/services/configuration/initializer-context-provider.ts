import { PluginInitializerContext } from "opensearch-dashboards/public";
import { CorePluginConfigType } from "../../../server/index";
import { IConfigurationProvider } from "../../../common/services/configuration/configuration-provider";
import { EConfigurationProviders } from "../../../common/constants";

export class InitializerConfigProvider implements IConfigurationProvider {
  private config: CorePluginConfigType = {} as CorePluginConfigType;
  private name: string = EConfigurationProviders.INITIALIZER_CONTEXT;

  constructor(private initializerContext: PluginInitializerContext<CorePluginConfigType>) {
    this.initializeConfig();
  }

  setName(name: string): void {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  private async initializeConfig(): Promise<void> {
    this.config = this.initializerContext.config.get<CorePluginConfigType>();
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