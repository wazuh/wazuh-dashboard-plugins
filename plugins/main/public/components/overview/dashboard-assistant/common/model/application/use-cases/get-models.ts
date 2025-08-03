import type { Model } from '../../domain/model';
import { ModelRepository } from '../ports/model-repository';

export const getModelsUseCase =
  (modelRepository: ModelRepository) => async (): Promise<Model[]> => {
    const models = await modelRepository.getAll();

    return models;
  };
