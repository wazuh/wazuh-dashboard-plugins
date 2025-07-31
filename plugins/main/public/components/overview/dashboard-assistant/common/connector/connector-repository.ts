import { IConnectorRepository } from './domain/types';
import { Connector } from './domain/connector';
import { IHttpClient } from '../installation-manager/domain/types';

const getProxyPath = (path: string, method: string) => `/api/console/proxy?path=${path}&method=${method}&dataSourceId=`;

export class ConnectorRepository implements IConnectorRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(connector: Connector): Promise<string> {
    const response = (await this.httpClient.post(
      getProxyPath('/_plugins/_ml/connectors/_create', 'POST'),
      connector.toApiPayload(),
    )) as { connector_id: string };
    return response.connector_id;
  }

  public async findById(id: string): Promise<Connector | null> {
    try {
      const response = await this.httpClient.get(
        getProxyPath(`/_plugins/_ml/connectors/${id}`, 'GET'),
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
      getProxyPath(`/_plugins/_ml/connectors/${id}`, 'PUT'),
      connector.toApiPayload(),
    );
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.delete(getProxyPath(`/_plugins/_ml/connectors/${id}`, 'DELETE'));
  }

  public async getAll(): Promise<Connector[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 1000
      };

      const response = await this.httpClient.post(
        getProxyPath('/_plugins/_ml/connectors/_search', 'POST'),
        searchPayload
      ) as {
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      };

      const connectors = response.hits.hits.map((hit: any) => Connector.fromResponse(hit._source));
      return connectors;
    } catch (error) {
      console.error('Error fetching connectors:', error);
      throw error;
    }
  }
}
