import { ClusterSettings } from './cluster-settings';

export interface IClusterSettingsRepository {
  updateSettings(settings: ClusterSettings): Promise<void>;
}
