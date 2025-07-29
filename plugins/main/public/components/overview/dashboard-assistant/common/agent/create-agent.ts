// Create Agent Use Case

import type { IAgentRepository } from './domain/types';
import type { CreateAgentRequest } from '../assistant-manager/domain/types';
import { Agent } from './domain/agent';
import { AgentLLM } from './domain/agent-llm';

export class CreateAgentUseCase {
  constructor(
    private readonly agentRepository: IAgentRepository
  ) {}

  public async execute(request: CreateAgentRequest): Promise<string> {
    const agent = Agent.create({
      name: request.name,
      description: request.description,
      modelId: request.modelId
    });
    
    const agentId = await this.agentRepository.create(agent);
    
    return agentId;
  }
}