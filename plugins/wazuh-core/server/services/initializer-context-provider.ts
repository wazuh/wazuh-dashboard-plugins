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
    return this.config[key];
  }
}