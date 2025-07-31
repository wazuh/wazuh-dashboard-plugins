import { Connector } from './connector';

export interface IConnectorRepository {
  create(connector: Connector): Promise<string>;
  findById(id: string): Promise<Connector | null>;
  getAll(): Promise<Connector[]>;
  update(id: string, connector: Connector): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CreateConnectorRequest {
  name: string;
  description: string;
  endpoint: string;
  model: string;
  apiKey: string;
}
