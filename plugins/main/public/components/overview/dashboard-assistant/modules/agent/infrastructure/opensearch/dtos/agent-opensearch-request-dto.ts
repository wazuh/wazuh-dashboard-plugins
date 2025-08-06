import { Agent } from '../../../domain/entities/agent';
import { AppType } from '../../../domain/enums/app-type';
import { AgentLLMOpenSearchRequestDto } from './agent-llm-opensearch-request-dto';

export interface AgentOpenSearchRequestDto
  extends Pick<Agent, 'name' | 'type' | 'description' | 'tools'> {
  memory: {
    type: 'conversation_index';
  };
  llm: AgentLLMOpenSearchRequestDto;
  app_type: AppType;
}
