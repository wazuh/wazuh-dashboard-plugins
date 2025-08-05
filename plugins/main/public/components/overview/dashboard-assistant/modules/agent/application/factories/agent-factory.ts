import { Agent } from '../../domain/entities/agent';
import { AppType } from '../../domain/enums/app-type';
import { CreateAgentDto } from '../dtos/create-agent-dto';
import { AgentLLMFactory } from './agent-llm-factory';

export class AgentFactory {
  public static create(config: CreateAgentDto): Agent {
    const llm = AgentLLMFactory.create(
      config.llm.model_id,
      config.llm.parameters.response_filter,
    );

    return {
      name: config.name,
      type: config.type,
      description: config.description,
      llm,
      memory: {
        type: 'conversation_index',
      },
      app_type: AppType.CHAT_WITH_RAG,
      tools: config.tools,
    } as Agent;
  }

  public static fromResponse(
    config: Exclude<Agent, 'id'> & { agent_id: string },
  ): Agent {
    return {
      ...config,
      id: config.agent_id,
    } as Agent;
  }
}
