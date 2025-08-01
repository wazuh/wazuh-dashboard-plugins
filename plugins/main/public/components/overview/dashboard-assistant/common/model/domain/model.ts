export enum ModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

export class Model {
  constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly functionName: string,
    private readonly modelGroupId: string,
    private readonly connectorId: string,
    private readonly description: string,
    private readonly version: string = '1',
    private readonly status: ModelStatus = ModelStatus.ACTIVE,
    private readonly createdAt: string = new Date().toISOString(),
    private readonly apiUrl: string = '',
  ) {}

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

  public getId(): string | null {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getFunctionName(): string {
    return this.functionName;
  }

  public getStatus(): ModelStatus {
    return this.status;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public getApiUrl(): string {
    return this.apiUrl;
  }

  public getDescription(): string {
    return this.description;
  }

  public getVersion(): string {
    return this.version;
  }

  /*
    Example from model index response
    {
        "_index": ".plugins-ml-model",
        "_id": "MlltW5gB4MWYH9jGYCed",
        "_version": 3,
        "_seq_no": 2,
        "_primary_term": 1,
        "_score": 1,
        "_source": {
          "last_deployed_time": 1753880551819,
          "model_version": "1",
          "created_time": 1753880551537,
          "deploy_to_all_nodes": true,
          "is_hidden": false,
          "description": "claude 3 haiku",
          "model_state": "DEPLOYED",
          "planning_worker_node_count": 1,
          "auto_redeploy_retry_times": 0,
          "last_updated_time": 1753880551819,
          "name": "claude-3-5-sonnet-20241022",
          "connector_id": "L1ltW5gB4MWYH9jGOSfJ",
          "current_worker_node_count": 1,
          "model_group_id": "MFltW5gB4MWYH9jGYCc0",
          "planning_worker_nodes": [
            "g0Z8cu2VRQeFgzmDkxU5Mw"
          ],
          "algorithm": "REMOTE"
        }
      }
  */

  public static fromResponse(data: any): Model {
    // Handle OpenSearch response structure with _id and _source
    const source = data._source || data;
    const id = data._id || data.model_id || data.id;

    // Map model_state to our status format
    const mapModelState = (state: string): ModelStatus => {
      switch (state?.toUpperCase()) {
        case 'DEPLOYED':
        case 'LOADED':
          return ModelStatus.ACTIVE;
        case 'UNDEPLOYED':
        case 'NOT_DEPLOYED':
          return ModelStatus.INACTIVE;
        case 'DEPLOY_FAILED':
        case 'LOAD_FAILED':
          return ModelStatus.ERROR;
        default:
          return data.status || ModelStatus.ACTIVE;
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

  public toApiPayload(): object {
    return {
      name: this.name,
      function_name: this.functionName,
      model_group_id: this.modelGroupId,
      connector_id: this.connectorId,
      description: this.description,
    };
  }

  public toTableFormat(): {
    id: string;
    name: string;
    function_name: string;
    version: string;
    description: string;
    status: ModelStatus;
    createdAt: string;
    apiUrl: string;
  } {
    return {
      id: this.id || '',
      name: this.name,
      function_name: this.functionName,
      version: this.version,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      apiUrl: this.apiUrl,
    };
  }
}
