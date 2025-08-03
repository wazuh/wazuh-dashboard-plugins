import { ClusterSettings } from '../../domain/entities/cluster-settings';

export interface MLCommonsSettingsRepository {
  updateSettings(settings: ClusterSettings): Promise<boolean>;
  getSettings(): Promise<any>;
}
