import { IModelGroupRepository } from './domain/types';
import { ModelGroup } from './domain/model-group';
import { IHttpClient } from '../installation-manager/domain/types';

export class ModelGroupRepository implements IModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroup: ModelGroup): Promise<string> {
    const response = (await this.httpClient.post(
      '/_plugins/_ml/model_groups/_register',
      modelGroup.toApiPayload(),
    )) as { model_group_id: string };
    return response.model_group_id;
  }

  public async findById(id: string): Promise<ModelGroup | null> {
    try {
      const response = (await this.httpClient.get(
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
    await this.httpClient.put(
      `/_plugins/_ml/model_groups/${id}`,
      modelGroup.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/_plugins/_ml/model_groups/${id}`);
  }
}
