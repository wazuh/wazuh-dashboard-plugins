import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { CreateConnectorDto } from '../../../application/dtos/create-connector-dto';
import { ConnectorFactory } from '../../../application/factories/connector-factory';
import { ConnectorRepository } from '../../../application/ports/connector-repository';
import { Connector } from '../../../domain/entities/connector';
import { ConnectorResponseDto } from '../dtos/connector-opensearch-response-dto';

export class ConnectorOpenSearchRepository implements ConnectorRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(connectorDto: CreateConnectorDto): Promise<Connector> {
    const connector = ConnectorFactory.create(connectorDto);
    const response =
      await this.httpClient.proxyRequest.post<ConnectorResponseDto>(
        '/_plugins/_ml/connectors/_create',
        connector,
      );
    return ConnectorFactory.fromResponse({
      ...connector,
      connector_id: response.connector_id,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.proxyRequest.delete(`/_plugins/_ml/connectors/${id}`);
  }

  public async getAll(): Promise<Connector[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 1000,
      };

      const response = await this.httpClient.proxyRequest.post<{
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      }>('/_plugins/_ml/connectors/_search', searchPayload);

      return response.hits.hits.map((hit: any) =>
        ConnectorFactory.fromResponse(hit._source),
      );
    } catch (error) {
      console.error('Error fetching connectors:', error);
      throw error;
    }
  }
}
