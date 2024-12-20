import {
  IUiSettingsClient,
  PublicUiSettingsParams,
  UserProvidedValues,
} from 'opensearch-dashboards/public';
import { IConfigurationProvider } from '../../../common/services/configuration/configuration-provider';
import { EConfigurationProviders } from '../../../common/constants';

export class UISettingsConfigProvider implements IConfigurationProvider {
  private name: string = EConfigurationProviders.PLUGIN_UI_SETTINGS;
  constructor(private uiSettings: IUiSettingsClient) {}

  setName(name: string): void {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  async get(key: string): Promise<any> {
    return this.uiSettings.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    await this.uiSettings.set(key, value);
  }

  async getAll() {
    const settings = this.uiSettings.getAll();
    // loop and get all settings that have the category wazuhCore
    const wazuhCoreSettings = Object.keys(settings).reduce(
      (acc, key) => {
        if (
          settings[key].category &&
          settings[key].category.includes('wazuhCore')
        ) {
          acc[key] = settings[key];
        }
        return acc;
      },
      {} as Record<string, PublicUiSettingsParams & UserProvidedValues>,
    );
    return wazuhCoreSettings;
  }
}
