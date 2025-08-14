import { MlCommonsPluginSettings } from './plugin-settings';

export interface ClusterSettings {
  persistent: {
    plugins: MlCommonsPluginSettings;
  };
}
