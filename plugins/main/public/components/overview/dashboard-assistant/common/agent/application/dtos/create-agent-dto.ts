import { AgentLLM } from '../../domain/entities/agent-llm';
import { AgentTool } from '../../domain/entities/agent-tool';
import { AgentType } from '../../domain/enums/agent-type';

export interface CreateAgentDto {
  name: string;
  type: AgentType;
  description: string;
  llm: AgentLLM;
  tools: AgentTool[];
}
