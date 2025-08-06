import { Model } from '../../domain/entities/model';
import { ModelStatus } from '../../domain/enums/model-status';

export class ModelFactory {
  static create(props: {
    id: string;
    name: string;
    function_name: string;
    model_group_id?: string;
    connector_id: string;
    description: string;
  }): Model {
    return {
      id: props.id,
      name: props.name,
      function_name: props.function_name,
      model_group_id: props.model_group_id,
      connector_id: props.connector_id,
      description: props.description,
      version: '1',
      status: ModelStatus.ACTIVE,
      created_at: new Date().toISOString(),
    };
  }
}
