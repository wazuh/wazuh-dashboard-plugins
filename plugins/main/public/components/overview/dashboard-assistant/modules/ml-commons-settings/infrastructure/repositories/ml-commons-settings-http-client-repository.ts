import { IHttpClient } from '../../../common/http/domain/entities/http-client';
import { CreateMLCommonsDto } from '../../application/dtos/create-ml-commons-dto';
import { MLCommonsSettingsCreateFactory } from '../factories/ml-commons-settings-factory';
import { MLCommonsSettingsRepository } from '../../application/ports/ml-commons-settings-repository';
import { ClusterSettings } from '../../domain/entities/cluster-settings';

export class MLCommonsSettingsHttpClientRepository
  implements MLCommonsSettingsRepository
{
  constructor(private readonly httpClient: IHttpClient) {}

  public async persist(dto: CreateMLCommonsDto): Promise<boolean> {
    const response = await this.httpClient.proxyRequest.post.WithPut(
      '/_cluster/settings',
      {
        persistent: {
          plugins: MLCommonsSettingsCreateFactory.create(dto),
        },
      } as ClusterSettings,
    );

    if (response.acknowledged) {
      return true;
    } else {
      throw new Error('Failed to update cluster settings');
    }
  }

  public async retrieve(): Promise<any> {
    try {
      return await this.httpClient.proxyRequest.post(
        '/_cluster/settings?include_defaults=true',
      );
    } catch (error) {
      console.error('Error fetching cluster settings:', error);
      throw error;
    }
  }
}
