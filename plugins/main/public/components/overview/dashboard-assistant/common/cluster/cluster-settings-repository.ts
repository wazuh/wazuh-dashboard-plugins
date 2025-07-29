import { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';
import { IHttpClient } from '../installation-manager/domain/types';

export class ClusterSettingsRepository implements IClusterSettingsRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async updateSettings(settings: ClusterSettings): Promise<void> {
    await this.httpClient.put('/_cluster/settings', settings.toApiPayload());
  }
}
