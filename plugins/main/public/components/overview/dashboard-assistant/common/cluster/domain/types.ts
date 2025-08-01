import { ClusterSettings } from './cluster-settings';

export interface IClusterSettingsRepository {
  updateSettings(settings: ClusterSettings): Promise<void>;
  getSettings(): Promise<any>;
  getMLStats(): Promise<any>;
}
