import { MlCommonsPluginSettings } from '../../domain/entities/plugin-settings';

export interface MLCommonsSettingsRepository {
  persist(pluginSettings: MlCommonsPluginSettings): Promise<boolean>;
  retrieve(): Promise<any>;
}
