import {
  IUiSettingsClient,
  PublicUiSettingsParams,
  UserProvidedValues,
} from 'opensearch-dashboards/public';
import { IConfigurationProvider } from '../../../common/services/configuration/configuration-provider';
import { EConfigurationProviders } from '../../../common/constants';

export class UISettingsConfigProvider implements IConfigurationProvider {
  private name: string = EConfigurationProviders.PLUGIN_UI_SETTINGS;

  constructor(private readonly uiSettings: IUiSettingsClient) {}

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
    const wazuhCoreSettings: Record<
      string,
      PublicUiSettingsParams & UserProvidedValues
    > = {};

    for (const key in settings) {
      if (
        settings[key].category &&
        settings[key].category.includes('wazuhCore')
      ) {
        wazuhCoreSettings[key] = settings[key];
      }
    }

    return wazuhCoreSettings;
  }
}
