import { IModelGroupRepository } from './domain/types';
import { ModelGroup } from './domain/model-group';
import { IHttpClient } from '../installation-manager/domain/types';

export class ModelGroupHttpClientRepository implements IModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroup: ModelGroup): Promise<string> {
    const response = (await this.httpClient.proxyRequest.post(
      '/_plugins/_ml/model_groups/_register',
      modelGroup.toApiPayload(),
    )) as { model_group_id: string };
    return response.model_group_id;
  }

  public async findById(id: string): Promise<ModelGroup | null> {
    try {
      const response = (await this.httpClient.proxyRequest.get(
        `/_plugins/_ml/model_groups/${id}`,
      )) as {
        model_group_id: string;
        name: string;
        description: string;
      };
      return ModelGroup.fromResponse(
        response.model_group_id,
        response.name,
        response.description,
      );
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async update(id: string, modelGroup: ModelGroup): Promise<void> {
    await this.httpClient.proxyRequest.put(
      `/_plugins/_ml/model_groups/${id}`,
      modelGroup.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.proxyRequest.delete(
      `/_plugins/_ml/model_groups/${id}`,
    );
  }

  public async getAll(): Promise<ModelGroup[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 1000,
      };

      const response = (await this.httpClient.proxyRequest.post(
        '/_plugins/_ml/model_groups/_search',
        searchPayload,
      )) as {
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      };

      const modelGroups = response.hits.hits.map((hit: any) =>
        ModelGroup.fromResponse(
          hit._source.model_group_id || hit._source.id,
          hit._source.name,
          hit._source.description,
        ),
      );
      return modelGroups;
    } catch (error) {
      console.error('Error fetching model groups:', error);
      throw error;
    }
  }
}
