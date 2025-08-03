import type { ModelPredictResponse } from '../../domain/types';
import { ModelRepository } from '../ports/model-repository';

export const testModelConnectionUseCase =
  (modelRepository: ModelRepository) =>
  async (modelId: string): Promise<ModelPredictResponse> => {
    return await modelRepository.testConnection(modelId);
  };
