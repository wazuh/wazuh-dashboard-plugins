import type { AgentRepository as AgentRepository } from '../ports/agent-repository';

export const getRegisterAgentCommandByModelIdUseCase =
  (agentRepository: AgentRepository) =>
  async (modelId: string): Promise<string> => {
    const agent = await agentRepository.findByModelId(modelId);
    if (!agent) throw new Error('Agent not found');
    return await agentRepository.getRegisterCommand(agent.id);
  };
