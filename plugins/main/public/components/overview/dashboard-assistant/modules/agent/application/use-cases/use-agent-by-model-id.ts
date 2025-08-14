import { AgentRepository } from '../ports/agent-repository';

export const useAgentByModelIdUseCase =
  (agentRepository: AgentRepository) => async (modelId: string) => {
    const agent = await agentRepository.findByModelId(modelId);
    if (agent) {
      await agentRepository.register(agent.id);
    }
  };
