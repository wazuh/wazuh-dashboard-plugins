// Create Agent Use Case

import { IAgentRepository, CreateAgentRequest } from './domain/types';
import { Agent } from './domain/agent';
import { ILogger } from '../installation-manager/domain/types';

export class CreateAgentUseCase {
  constructor(
    private readonly agentRepository: IAgentRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: CreateAgentRequest): Promise<string> {
    this.logger.info(`Creating agent: ${request.name}`);
    
    const agent = Agent.create({
      name: request.name,
      description: request.description,
      modelId: request.modelId
    });
    
    const agentId = await this.agentRepository.create(agent);
    
    this.logger.info(`Agent created with ID: ${agentId}`);
    return agentId;
  }
}