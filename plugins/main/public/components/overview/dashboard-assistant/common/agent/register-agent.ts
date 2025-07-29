// Register Agent Use Case
import type { IAgentRepository } from './domain/types';
import type { RegisterAgentRequest } from '../assistant-manager/domain/types';



export const registerAgentUseCase = (agentRepository: IAgentRepository) => async (request: RegisterAgentRequest): Promise<void> => {
  await agentRepository.register(request.agentId);
}