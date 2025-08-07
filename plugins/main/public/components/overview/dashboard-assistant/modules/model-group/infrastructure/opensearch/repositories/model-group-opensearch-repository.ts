import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { CreateModelGroupDto } from '../../../application/dtos/create-model-group-dto';
import { ModelGroupRepository } from '../../../application/ports/model-group-repository';
import { ModelGroup } from '../../../domain/entities/model-group';
import { ModelGroupOpenSearchResponseCreateDto } from '../dtos/model-group-opensearch-response-create-dto';
import { ModelGroupOpenSearchMapper } from '../mapper/model-group-opensearch-mapper';

export class ModelGroupOpenSearchRepository implements ModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroupDto: CreateModelGroupDto): Promise<ModelGroup> {
    const { model_group_id } =
      await this.httpClient.proxyRequest.post<ModelGroupOpenSearchResponseCreateDto>(
        '/_plugins/_ml/model_groups/_register',
        modelGroupDto,
      );
    return ModelGroupOpenSearchMapper.toModel({
      id: model_group_id,
      name: modelGroupDto.name,
      description: modelGroupDto.description,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.proxyRequest.post.WithDelete(
      `/_plugins/_ml/model_groups/${id}`,
    );
  }
}
