import { IConnectorRepository } from './domain/types';
import { Connector } from './domain/connector';
import { IHttpClient } from '../installation-manager/domain/types';

export class ConnectorRepository implements IConnectorRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(connector: Connector): Promise<string> {
    const response = await this.httpClient.post(
      '/_plugins/_ml/connectors/_create',
      connector.toApiPayload()
    ) as { connector_id: string };
    return response.connector_id;
  }

  public async findById(id: string): Promise<Connector | null> {
    try {
      const response = await this.httpClient.get(`/_plugins/_ml/connectors/${id}`);
      // TODO: Implement Connector.fromResponse method
      throw new Error('Method not implemented');
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async update(id: string, connector: Connector): Promise<void> {
    await this.httpClient.put(
      `/_plugins/_ml/connectors/${id}`,
      connector.toApiPayload()
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/_plugins/_ml/connectors/${id}`);
  }
}