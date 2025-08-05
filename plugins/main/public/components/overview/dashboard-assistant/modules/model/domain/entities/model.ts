import { ModelStatus } from '../enums/model-status';

export class Model {
  public readonly id: string | null;
  public readonly name: string;
  public readonly function_name: string;
  public readonly model_group_id?: string;
  public readonly connector_id: string;
  public readonly description: string;
  public readonly version: string;
  public readonly status: ModelStatus;
  public readonly created_at: string;

  constructor(params: {
    id: string;
    name: string;
    function_name: string;
    model_group_id?: string;
    connector_id: string;
    description: string;
    version?: string;
    status?: ModelStatus;
    created_at?: string;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.function_name = params.function_name;
    this.model_group_id = params.model_group_id;
    this.connector_id = params.connector_id;
    this.description = params.description;
    this.version = params.version || '1';
    this.status = params.status || ModelStatus.ACTIVE;
    this.created_at = params.created_at || new Date().toISOString();
  }

  public toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      function_name: this.function_name,
      model_group_id: this.model_group_id,
      connector_id: this.connector_id,
      description: this.description,
      version: this.version,
      status: this.status,
      created_at: this.created_at,
    };
  }

  public toTableFormat() {
    return {
      name: this.name,
      id: this.id || '',
      version: this.version,
      status: this.status,
      createdAt: this.created_at,
    };
  }
}
