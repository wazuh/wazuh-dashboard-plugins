import { Agent } from '../../domain/entities/agent';
import { AgentLLM } from '../../domain/entities/agent-llm';

export type CreateAgentDto = Omit<Agent, 'id' | 'llm'> &
  Pick<AgentLLM, 'model_id' | 'response_filter'> & {
    extra_parameters?: Record<string, any>;
  };
