import type { Model } from '../../domain/entities/model';
import { ModelRepository } from '../ports/model-repository';

export const getModelsUseCase =
  (modelRepository: ModelRepository) => async (): Promise<Model[]> => {
    return await modelRepository.getAll();
  };
