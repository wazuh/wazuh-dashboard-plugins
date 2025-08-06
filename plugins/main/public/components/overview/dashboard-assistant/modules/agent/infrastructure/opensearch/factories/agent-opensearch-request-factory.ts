import { Agent } from '../../../domain/entities/agent';
import { AppType } from '../../../domain/enums/app-type';
import { CreateAgentDto } from '../../../application/dtos/create-agent-dto';
import { AgentLLMFactory } from '../../../application/factories/agent-llm-factory';
import { AgentOpenSearchRequestDto } from '../dtos/agent-opensearch-request-dto';

export class AgentOpenSearchRequestFactory {
  public static create(config: CreateAgentDto): AgentOpenSearchRequestDto {
    const llm = AgentLLMFactory.create(
      config.llm.model_id,
      config.llm.parameters.response_filter ?? '',
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
    };
  }
}
