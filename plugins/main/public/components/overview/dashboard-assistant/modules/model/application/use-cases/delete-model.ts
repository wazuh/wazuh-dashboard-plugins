import { ModelRepository } from '../ports/model-repository';

export const deleteModelUseCase =
  (modelRepository: ModelRepository) => async (modelId: string) => {
    await modelRepository.delete(modelId);
  };
