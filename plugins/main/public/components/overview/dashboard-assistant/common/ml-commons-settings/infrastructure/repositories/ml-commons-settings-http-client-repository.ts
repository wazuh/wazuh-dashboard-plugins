import { MLCommonsSettingsRepository } from '../../application/ports/ml-commons-settings-repository';
import { IHttpClient } from '../../../http/domain/entities/http-client';
import { ClusterSettings } from '../../domain/entities/cluster-settings';

export class MLCommonsSettingsHttpClientRepository
  implements MLCommonsSettingsRepository
{
  constructor(private readonly httpClient: IHttpClient) {}

  public async updateSettings(settings: ClusterSettings): Promise<boolean> {
    const response = await this.httpClient.proxyRequest.post.WithPut(
      '/_cluster/settings',
      settings,
    );

    if (response.acknowledged) {
      return true;
    } else {
      throw new Error('Failed to update cluster settings');
    }
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
}
