import { ClusterSettings } from '../../domain/entities/cluster-settings';

export interface MLCommonsSettingsRepository {
  persist(settings: ClusterSettings): Promise<boolean>;
  retrieve(): Promise<any>;
}
