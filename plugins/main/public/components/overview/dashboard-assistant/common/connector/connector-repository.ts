import { IConnectorRepository } from './domain/types';
import { Connector } from './domain/connector';
import { IHttpClient } from '../installation-manager/domain/types';

const getProxyPath = (method: string, path: string) =>
  `/api/console/proxy?path=${path}&method=${method}&dataSourceId=`;

export class ConnectorRepository implements IConnectorRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(connector: Connector): Promise<string> {
    const response = (await this.httpClient.post(
      getProxyPath('POST', '/_plugins/_ml/connectors/_create'),
      connector.toApiPayload(),
    )) as { connector_id: string };
    return response.connector_id;
  }

  public async findById(id: string): Promise<Connector | null> {
    try {
      const response = await this.httpClient.get(
        getProxyPath('GET', `/_plugins/_ml/connectors/${id}`),
      );
      // TODO: Implement Connector.fromResponse method
      throw new Error('Method not implemented');
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async update(id: string, connector: Connector): Promise<void> {
    await this.httpClient.put(
      getProxyPath('PUT', `/_plugins/_ml/connectors/${id}`),
      connector.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(
      getProxyPath('DELETE', `/_plugins/_ml/connectors/${id}`),
    );
  }

  public async getAll(): Promise<Connector[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 1000,
      };

      const response = (await this.httpClient.post(
        getProxyPath('POST', '/_plugins/_ml/connectors/_search'),
        searchPayload,
      )) as {
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      };

      const connectors = response.hits.hits.map((hit: any) =>
        Connector.fromResponse(hit._source),
      );
      return connectors;
    } catch (error) {
      console.error('Error fetching connectors:', error);
      throw error;
    }
  }
}
