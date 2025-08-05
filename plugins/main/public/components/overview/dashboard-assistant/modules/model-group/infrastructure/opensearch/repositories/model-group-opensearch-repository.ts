import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { CreateModelGroupDto } from '../../../application/dtos/create-model-group-dto';
import { ModelGroupFactory } from '../../../application/factories/model-group-factory';
import { ModelGroupRepository } from '../../../application/ports/model-group-repository';
import { ModelGroup } from '../../../domain/entities/model-group';

export class ModelGroupOpenSearchRepository implements ModelGroupRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(modelGroupDto: CreateModelGroupDto): Promise<ModelGroup> {
    const { model_group_id } = await this.httpClient.proxyRequest.post<{
      model_group_id: string;
    }>('/_plugins/_ml/model_groups/_register', modelGroupDto);
    return ModelGroupFactory.create({
      id: model_group_id,
      name: modelGroupDto.name,
      description: modelGroupDto.description,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.proxyRequest.delete(
      `/_plugins/_ml/model_groups/${id}`,
    );
  }
}
