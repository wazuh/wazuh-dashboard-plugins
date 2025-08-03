import { ModelRepository } from '../ports/model-repository';

/**
 * Factory function to create a delete model use case
 * @param modelRepository - The model repository instance
 */
export const deleteModelUseCase =
  (modelRepository: ModelRepository) => (modelId: string) => {
    modelRepository.delete(modelId);
  };
