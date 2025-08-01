import { IAgentRepository } from './domain/types';
import { Agent } from './domain/agent';
import { IHttpClient } from '../installation-manager/domain/types';

export class AgentRepository implements IAgentRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  public async create(agent: Agent): Promise<string> {
    const response = (await this.httpClient.proxyRequest.post(
      '/_plugins/_ml/agents/_register',
      { ...agent.toApiPayload() },
    )) as { agent_id: string };
    return response.agent_id;
  }

  public async findById(id: string): Promise<Agent | null> {
    try {
      const response = await this.httpClient.proxyRequest.get(
        `/_plugins/_ml/agents/${id}`,
      );
      // TODO: Implement Agent.fromResponse method
      throw new Error('Method not implemented');
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  public async update(id: string, agent: Agent): Promise<void> {
    await this.httpClient.proxyRequest.put(
      `/_plugins/_ml/agents/${id}`,
      agent.toApiPayload(),
    );
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

      const response = (await this.httpClient.proxyRequest.post(
        '/_plugins/_ml/agents/_search',
        searchPayload,
      )) as {
        hits: {
          hits: Array<{
            _source: any;
          }>;
        };
      };

      const agents = response.hits.hits.map((hit: any) =>
        Agent.fromResponse(hit._source),
      );
      return agents;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }
}
