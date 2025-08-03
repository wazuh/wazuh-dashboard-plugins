import { PluginSettings } from './plugin-settings';

export interface ClusterSettings {
  persistent: {
    plugins: PluginSettings;
  };
}
