import { AgentType } from '../enums/agent-type';
import { AgentLLM } from './agent-llm';
import { AgentTool } from './agent-tool';

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  llm: AgentLLM;
  tools: AgentTool[];
}
