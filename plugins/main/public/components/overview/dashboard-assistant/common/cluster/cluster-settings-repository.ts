import { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';
import { IHttpClient } from '../installation-manager/domain/types';

const getProxyPath = (path: string, method: string) => `/api/console/proxy?path=${path}&method=${method}&dataSourceId=`;

export class ClusterSettingsRepository implements IClusterSettingsRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async updateSettings(settings: ClusterSettings): Promise<void> {
    await this.httpClient.post(getProxyPath('/_cluster/settings', 'PUT'), settings.toApiPayload());
  }

  public async getSettings(): Promise<any> {
    try {
      const response = await this.httpClient.post(
        getProxyPath('/_cluster/settings?include_defaults=true', 'POST')
      );
      return response;
    } catch (error) {
      console.error('Error fetching cluster settings:', error);
      throw error;
    }
  }

  public async getMLStats(): Promise<any> {
    try {
      const response = await this.httpClient.get(
        getProxyPath('/_plugins/_ml/stats', 'GET')
      );
      return response;
    } catch (error) {
      console.error('Error fetching ML stats:', error);
      throw error;
    }
  }
}
