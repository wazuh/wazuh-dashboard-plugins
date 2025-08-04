import { CreateAgentDto } from '../dtos/create-agent-dto';
import type { IAgentRepository } from '../ports/agent-repository';

export const createAgentUseCase =
  (agentRepository: IAgentRepository) => async (agentDto: CreateAgentDto) => {
    return await agentRepository.create(agentDto);
  };
