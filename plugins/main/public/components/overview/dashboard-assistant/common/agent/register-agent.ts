// Register Agent Use Case
import type { IAgentRepository } from './domain/types';
import type { RegisterAgentRequest } from '../assistant-manager/domain/types';

export class RegisterAgentUseCase {
  constructor(
    private readonly agentRepository: IAgentRepository
  ) {}

  public async execute(request: RegisterAgentRequest): Promise<void> {
    await this.agentRepository.register(request.agentId);
  }
}