import { IHttpClient } from '../../../http/domain/entities/http-client';
import { CreateModelGroupDto } from '../../application/dtos/create-model-group-dto';
import { UpdateModelGroupDto } from '../../application/dtos/update-model-group-dto';
import { ModelGroupFactory } from '../../application/factories/model-group-factory';
import { IModelGroupRepository } from '../../application/ports/model-group-repository';
import { ModelGroup } from '../../domain/model-group';

export class ModelGroupHttpClientRepository implements IModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroupDTO: CreateModelGroupDto): Promise<ModelGroup> {
    const { model_group_id } = await this.httpClient.proxyRequest.post<{
      model_group_id: string;
    }>('/_plugins/_ml/model_groups/_register', modelGroupDTO);
    return ModelGroupFactory.fromResponse({
      id: model_group_id,
      name: modelGroupDTO.name,
      description: modelGroupDTO.description,
    });
  }

  public async findById(id: string): Promise<ModelGroup | null> {
    try {
      const response = await this.httpClient.proxyRequest.get<{
        model_group_id: string;
        name: string;
        description: string;
      }>(`/_plugins/_ml/model_groups/${id}`);
      return ModelGroupFactory.fromResponse({
        id: response.model_group_id,
        name: response.name,
        description: response.description,
      });
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async update(
    id: string,
    modelGroupDTO: UpdateModelGroupDto,
  ): Promise<void> {
    await this.httpClient.proxyRequest.put(
      `/_plugins/_ml/model_groups/${id}`,
      modelGroupDTO,
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

      const response = await this.httpClient.proxyRequest.post<{
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      }>('/_plugins/_ml/model_groups/_search', searchPayload);

      const modelGroups = response.hits.hits.map((hit: any) =>
        ModelGroupFactory.fromResponse({
          id: hit._source.model_group_id,
          name: hit._source.name,
          description: hit._source.description,
        }),
      );
      return modelGroups;
    } catch (error) {
      console.error('Error fetching model groups:', error);
      throw error;
    }
  }
}
