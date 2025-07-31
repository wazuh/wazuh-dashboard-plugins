import { IModelGroupRepository } from './domain/types';
import { ModelGroup } from './domain/model-group';
import { IHttpClient } from '../installation-manager/domain/types';

const getProxyPath = (path: string, method: string) => `/api/console/proxy?path=${path}&method=${method}&dataSourceId=`;

export class ModelGroupRepository implements IModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroup: ModelGroup): Promise<string> {
    const response = (await this.httpClient.post(
      getProxyPath('/_plugins/_ml/model_groups/_register', 'POST'),
      modelGroup.toApiPayload(),
    )) as { model_group_id: string };
    return response.model_group_id;
  }

  public async findById(id: string): Promise<ModelGroup | null> {
    try {
      const response = (await this.httpClient.get(
        getProxyPath(`/_plugins/_ml/model_groups/${id}`, 'GET'),
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
    await this.httpClient.put(
      getProxyPath(`/_plugins/_ml/model_groups/${id}`, 'PUT'),
      modelGroup.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(getProxyPath(`/_plugins/_ml/model_groups/${id}`, 'DELETE'));
  }

  public async getAll(): Promise<ModelGroup[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 1000
      };

      const response = await this.httpClient.post(
        getProxyPath('/_plugins/_ml/model_groups/_search', 'POST'),
        searchPayload
      ) as {
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
          hit._source.description
        )
      );
      return modelGroups;
    } catch (error) {
      console.error('Error fetching model groups:', error);
      throw error;
    }
  }
}
