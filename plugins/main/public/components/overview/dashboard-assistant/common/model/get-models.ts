import type { IModelRepository } from './domain/types';
import type { Model } from './domain/model';

export const getModelsUseCase =
  (modelRepository: IModelRepository) => async (): Promise<Model[]> => {
    try {
      const models = await modelRepository.getAll();

      return models;
    } catch (error) {
      throw error;
    }
  };
