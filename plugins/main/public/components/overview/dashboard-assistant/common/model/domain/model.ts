import { ModelStatus } from './model-status';

export class Model {
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

  constructor(
    public readonly id: string | null,
    public readonly name: string,
    public readonly functionName: string,
    public readonly modelGroupId: string,
    public readonly connectorId: string,
    public readonly description: string,
    public readonly version: string = '1',
    public readonly status: ModelStatus = ModelStatus.ACTIVE,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly apiUrl: string = '',
  ) {}

  public toPlainObject(): object {
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
