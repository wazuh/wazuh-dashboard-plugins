import { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';
import { IHttpClient } from '../installation-manager/domain/types';

export class ClusterSettingsRepository implements IClusterSettingsRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async updateSettings(settings: ClusterSettings): Promise<void> {
    await this.httpClient.proxyRequest.post.put(
      '/_cluster/settings',
      settings.toApiPayload(),
    );
  }

  public async getSettings(): Promise<any> {
    try {
      const response = await this.httpClient.proxyRequest.post(
        '/_cluster/settings?include_defaults=true',
      );
      return response;
    } catch (error) {
      console.error('Error fetching cluster settings:', error);
      throw error;
    }
  }

  public async getMLStats(): Promise<any> {
    try {
      const response = await this.httpClient.proxyRequest.get(
        '/_plugins/_ml/stats',
      );
      return response;
    } catch (error) {
      console.error('Error fetching ML stats:', error);
      throw error;
    }
  }
}
