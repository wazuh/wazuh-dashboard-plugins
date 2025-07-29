// Register Agent Use Case

import { IAgentRepository, RegisterAgentRequest } from './domain/types';
import { ILogger } from '../installation-manager/domain/types';

export class RegisterAgentUseCase {
  constructor(
    private readonly agentRepository: IAgentRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: RegisterAgentRequest): Promise<void> {
    this.logger.info(`Registering agent with ID: ${request.agentId}`);
    
    await this.agentRepository.register(request.agentId);
    
    this.logger.info('Agent registered successfully in indexer manager');
  }
}