import { IHttpClient } from '../../common/http/domain/entities/http-client';
import { CreateAgentDto } from '../application/dtos/create-agent-dto';
import { AgentFactory } from '../application/factories/agent-factory';
import { IAgentRepository } from '../application/ports/agent-repository';
import { Agent } from '../domain/entities/agent';

export class AgentHttpClientRepository implements IAgentRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(agentDto: CreateAgentDto) {
    const agent = AgentFactory.create(agentDto);
    const response = (await this.httpClient.proxyRequest.post(
      '/_plugins/_ml/agents/_register',
      agent,
    )) as { agent_id: string };
    return AgentFactory.fromResponse({
      ...agent,
      agent_id: response.agent_id,
    });
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
    await this.httpClient.proxyRequest.post.WithPut(
      `/.plugins-ml-config/_doc/os_chat`,
      {
        type: 'os_chat_root_agent',
        configuration: {
          agent_id: agentId,
        },
      },
    );
  }

  public async getAll(): Promise<Agent[]> {
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
      }>('/_plugins/_ml/agents/_search', searchPayload);

      return response.hits.hits.map((hit: any) =>
        AgentFactory.fromResponse(hit._source),
      );
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }
}
