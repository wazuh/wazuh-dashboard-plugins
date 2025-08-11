import type { AgentRepository as AgentRepository } from '../ports/agent-repository';

export const getRegisterAgentCommandUseCase =
  (agentRepository: AgentRepository) =>
  async (agentId: string): Promise<string> => {
    return await agentRepository.getRegisterCommand(agentId);
  };
