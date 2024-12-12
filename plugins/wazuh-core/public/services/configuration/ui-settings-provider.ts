import { UiSettingsParams, IUiSettingsClient } from "opensearch-dashboards/public";
import { IConfigurationProvider } from "../../../common/services/configuration/configuration-provider";

export class UISettingsConfigProvider implements IConfigurationProvider {
    constructor(private uiSettings: IUiSettingsClient, private settingsDefinition: Record<string, UiSettingsParams>   ) {}
  
    async get(key: string): Promise<any> {
      return this.uiSettings.get(key);
    }
  
    async set(key: string, value: any): Promise<void> {
      await this.uiSettings.set(key, value);
    }

    async getAll(){
      // loop through the settingsDefinition and get all the settings
      let settings: Record<string, UiSettingsParams> = {};
      for (const key in this.settingsDefinition) {
        settings[key] = await this.get(key);
      }
      return settings;
    }
  }