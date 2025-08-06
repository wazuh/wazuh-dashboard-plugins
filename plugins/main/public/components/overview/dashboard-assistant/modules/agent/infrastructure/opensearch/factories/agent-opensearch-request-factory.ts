import { AppType } from '../../../domain/enums/app-type';
import { CreateAgentDto } from '../../../application/dtos/create-agent-dto';
import { AgentLLMOpenSearchRequestFactory } from './agent-llm-opensearch-request-factory';
import { AgentOpenSearchRequestDto } from '../dtos/agent-opensearch-request-dto';

export class AgentOpenSearchRequestFactory {
  public static create(config: CreateAgentDto): AgentOpenSearchRequestDto {
    const llm = AgentLLMOpenSearchRequestFactory.create({
      model_id: config.model_id,
      response_filter: config.response_filter ?? '',
      extra_parameters: config.extra_parameters,
    });

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
