import { Repository } from '../../domain/repository';
import { Agent } from './agent';

export interface IAgentRepository extends Repository<Agent> {
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
