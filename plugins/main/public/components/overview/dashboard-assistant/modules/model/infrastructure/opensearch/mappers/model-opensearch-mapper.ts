import { ModelStateMapper } from '../../../application/mapper/model-state-mapper';
import { Model } from '../../../domain/entities/model';
import { ModelStatus } from '../../../domain/enums/model-status';
import { ModelOpenSearchRequestCreateDto } from '../dtos/model-opensearch-request-create-dto';
import { ModelOpenSearchResponseDto } from '../dtos/model-opensearch-response-dto';

export class ModelOpenSearchMapper {
  public static fromRequest(
    id: string,
    source: ModelOpenSearchRequestCreateDto,
  ): Model {
    return {
      id,
      name: source.name,
      function_name: source.function_name,
      model_group_id: source.model_group_id,
      connector_id: source.connector_id,
      description: source.description,
      version: '1',
      status: ModelStatus.ACTIVE,
      created_at: new Date().toISOString(),
    };
  }

  public static fromResponse(
    id: string,
    source: ModelOpenSearchResponseDto,
  ): Model {
    return {
      id,
      name: source.name,
      function_name: source.algorithm.toLowerCase(),
      model_group_id: source.model_group_id,
      connector_id: source.connector_id,
      description: source.description,
      version: source.model_version,
      status: ModelStateMapper.toStatus(source.model_state),
      created_at: new Date(source.created_time).toISOString(),
    };
  }
}
