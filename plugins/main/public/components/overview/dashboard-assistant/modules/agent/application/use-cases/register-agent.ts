import type { AgentRepository as AgentRepository } from '../ports/agent-repository';

export const registerAgentUseCase =
  (agentRepository: AgentRepository) =>
  async (agentId: string): Promise<void> => {
    await agentRepository.register(agentId);
  };
