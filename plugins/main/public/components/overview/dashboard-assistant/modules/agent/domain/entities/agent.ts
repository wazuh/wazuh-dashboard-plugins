import { AgentLLM } from './agent-llm';
import { AgentTool } from './agent-tool';

export interface Agent {
  id?: string;
  type: string;
  name: string;
  description: string;
  llm: AgentLLM;
  tools: AgentTool[];
}
