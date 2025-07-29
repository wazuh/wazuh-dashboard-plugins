export class Model {
  constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly version: string,
    private readonly modelGroupId: string,
    private readonly connectorId: string,
    private readonly description: string,
    private readonly status: 'active' | 'inactive' | 'error' = 'active',
    private readonly createdAt: string = new Date().toISOString(),
    private readonly apiUrl: string = '',
  ) {}

  public static create(config: {
    name: string;
    version: string;
    modelGroupId: string;
    connectorId: string;
    description: string;
  }): Model {
    return new Model(
      null,
      config.name,
      config.version,
      config.modelGroupId,
      config.connectorId,
      config.description,
    );
  }

  public getId(): string | null {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getVersion(): string {
    return this.version;
  }

  public getStatus(): 'active' | 'inactive' | 'error' {
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

  public static fromResponse(data: any): Model {
    return new Model(
      data.model_id || data.id,
      data.name,
      data.version,
      data.model_group_id || data.modelGroupId,
      data.connector_id || data.connectorId,
      data.description,
      data.status || 'active',
      data.created_at || data.createdAt || new Date().toISOString(),
      data.api_url || data.apiUrl || '',
    );
  }

  public toApiPayload(): object {
    return {
      name: this.name,
      version: this.version,
      model_group_id: this.modelGroupId,
      connector_id: this.connectorId,
      description: this.description,
    };
  }

  public toTableFormat(): {
    id: string;
    name: string;
    version: string;
    status: 'active' | 'inactive' | 'error';
    createdAt: string;
    apiUrl: string;
  } {
    return {
      id: this.id || '',
      name: this.name,
      version: this.version,
      status: this.status,
      createdAt: this.createdAt,
      apiUrl: this.apiUrl,
    };
  }
}
