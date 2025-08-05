import { ModelStateMapper } from '../../../application/mapper/model-state-mapper';
import { Model } from '../../../domain/entities/model';
import { ModelIndexerResponse } from '../dtos/model-indexer-response';

export class ModelIndexerMapper {
  public static toModel(source: ModelIndexerResponse & { id: string }): Model {
    return new Model({
      id: source.id,
      name: source.name,
      function_name: source.algorithm.toLowerCase(),
      model_group_id: source.model_group_id,
      connector_id: source.connector_id,
      description: source.description,
      version: source.model_version,
      status: ModelStateMapper.toStatus(source.model_state),
      created_at: new Date(source.created_time).toISOString(),
    });
  }
}
