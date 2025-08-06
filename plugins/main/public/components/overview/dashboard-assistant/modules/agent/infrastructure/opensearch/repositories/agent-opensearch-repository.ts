import { IHttpClient } from '../../../../common/http/domain/entities/http-client';
import { CreateAgentDto } from '../../../application/dtos/create-agent-dto';
import { AgentOpenSearchRequestFactory } from '../factories/agent-opensearch-request-factory';
import { AgentRepository } from '../../../application/ports/agent-repository';
import { Agent } from '../../../domain/entities/agent';
import { AgentOpenSearchMapper } from '../mapper/agent-opensearch-mapper';
import { AgentOpenSearchResponseDto } from '../dtos/agent-opensearch-response-dto';
import { AgentOpenSearchResponseCreateDto } from '../dtos/agent-opensearch-response-create-dto';
import { OpenSearchResponseDto } from '../../../../common/infrastructure/opensearch/dtos/opensearch-response-dto';

export class AgentOpenSearchRepository implements AgentRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(agentDto: CreateAgentDto) {
    const agentOpenSearchRequest =
      AgentOpenSearchRequestFactory.create(agentDto);
    const response =
      await this.httpClient.proxyRequest.post<AgentOpenSearchResponseCreateDto>(
        '/_plugins/_ml/agents/_register',
        agentOpenSearchRequest,
      );
    return AgentOpenSearchMapper.fromRequest(
      response.agent_id,
      agentOpenSearchRequest,
    );
  }

  private findManyByModelId = async (
    modelId: string,
    opts: { size?: number } = {},
  ): Promise<Agent[]> => {
    const size = opts.size || 1000;

    const searchPayload = {
      query: {
        term: {
          'llm.model_id': {
            value: modelId,
          },
        },
      },
      size,
    };

    const {
      hits: { hits },
    } = await this.httpClient.proxyRequest.post<
      OpenSearchResponseDto<AgentOpenSearchResponseDto>
    >('/_plugins/_ml/agents/_search', searchPayload);

    if (hits.length > 0) {
      return hits.map(hit =>
        AgentOpenSearchMapper.fromResponse(hit._id, hit._source),
      );
    }
    return [];
  };

  public async findByModelId(modelId: string): Promise<Agent | null> {
    return (await this.findManyByModelId(modelId, { size: 1 }))[0] || null;
  }

  public async delete(id: string): Promise<void> {
    await this.httpClient.proxyRequest.delete(`/_plugins/_ml/agents/${id}`);
  }

  public async execute(id: string, parameters: any): Promise<any> {
    return await this.httpClient.proxyRequest.post(
      `/_plugins/_ml/agents/${id}/_execute`,
      parameters,
    );
  }

  public async register(agentId: string): Promise<void> {
    await this.httpClient.post(`/assistant/agent/register/${agentId}`);
  }

  public async getAll(): Promise<Agent[]> {
    try {
      const searchPayload = {
        query: { match_all: {} },
        size: 25,
      };

      const response = await this.httpClient.proxyRequest.post<
        OpenSearchResponseDto<AgentOpenSearchResponseDto>
      >('/_plugins/_ml/agents/_search', searchPayload);

      return response.hits.hits.map(hit =>
        AgentOpenSearchMapper.fromResponse(hit._id, hit._source),
      );
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }
}
