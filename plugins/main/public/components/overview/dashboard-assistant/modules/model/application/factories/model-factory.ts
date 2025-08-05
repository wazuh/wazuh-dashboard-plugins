import { Model } from '../../domain/entities/model';
import { ModelStatus } from '../../domain/enums/model-status';
import { ModelIndexerResponse } from '../../infrastructure/indexer-request/dtos/model-indexer-response';
import { ModelStateMapper } from '../mapper/model-state-mapper';

export class ModelFactory {
  static create(props: {
    id: string;
    name: string;
    function_name: string;
    model_group_id?: string;
    connector_id: string;
    description: string;
  }): Model {
    return new Model({
      id: props.id,
      name: props.name,
      function_name: props.function_name,
      model_group_id: props.model_group_id,
      connector_id: props.connector_id,
      description: props.description,
    });
  }
}
