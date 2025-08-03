import { Model } from '../../domain/model';
import { ModelState } from '../../domain/model-state';
import { ModelStatus } from '../../domain/model-status';

export class ModelFactory {
  public static create(config: {
    name: string;
    functionName: string;
    modelGroupId?: string;
    connectorId: string;
    description: string;
    version?: string;
  }): Model {
    return new Model(
      null,
      config.name,
      config.functionName,
      config.modelGroupId || '',
      config.connectorId,
      config.description,
      config.version || '1',
    );
  }

  // Handle OpenSearch response structure with _id and _source
  public static fromResponse(config: any): Model {
    const source = config._source || config;
    const id = config._id || config.model_id || config.id;

    // Map model_state to our status format
    const mapModelState = (state: string): ModelStatus => {
      switch (state?.toUpperCase()) {
        case ModelState.DEPLOYED:
        case ModelState.LOADED:
          return ModelStatus.ACTIVE;
        case ModelState.UNDEPLOYED:
        case ModelState.NOT_DEPLOYED:
          return ModelStatus.INACTIVE;
        case ModelState.DEPLOY_FAILED:
        case ModelState.LOAD_FAILED:
          return ModelStatus.ERROR;
        default:
          return config.status || ModelStatus.ACTIVE;
      }
    };

    return new Model(
      id,
      source.name,
      source.function_name || source.functionName || '',
      source.model_group_id || source.modelGroupId || '',
      source.connector_id || source.connectorId || '',
      source.description || '',
      source.model_version || source.version || '1',
      mapModelState(source.model_state),
      new Date(
        source.created_time ||
          source.created_at ||
          source.createdAt ||
          Date.now(),
      ).toISOString(),
      source.api_url || source.apiUrl || '',
    );
  }
}
