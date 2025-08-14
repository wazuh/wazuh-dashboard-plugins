import { CreateAgentDto } from '../dtos/create-agent-dto';
import type { AgentRepository } from '../ports/agent-repository';

export const createAgentUseCase =
  (agentRepository: AgentRepository) => async (agentDto: CreateAgentDto) => {
    return await agentRepository.create(agentDto);
  };
