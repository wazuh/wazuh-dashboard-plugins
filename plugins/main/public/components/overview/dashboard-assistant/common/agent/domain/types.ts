import { Agent } from './agent';

export interface IAgentRepository {
  create(agent: Agent): Promise<string>;
  findById(id: string): Promise<Agent | null>;
  update(id: string, agent: Agent): Promise<void>;
  delete(id: string): Promise<void>;
  execute(id: string, parameters: any): Promise<any>;
  register(agentId: string): Promise<void>;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  modelId: string;
}

export interface RegisterAgentRequest {
  agentId: string;
}
