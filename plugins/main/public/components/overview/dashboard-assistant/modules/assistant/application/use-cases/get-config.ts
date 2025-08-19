import type { AssistantRepository } from '../ports/assistant-repository';

export const getConfigUseCase =
  (assistantRepository: AssistantRepository) =>
  async (): Promise<any> => {
    return await assistantRepository.getConfig();
  };