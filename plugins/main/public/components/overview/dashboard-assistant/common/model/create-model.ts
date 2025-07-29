import type { IModelRepository } from './domain/types';
import type { CreateModelRequest } from '../assistant-manager/domain/types';
import { Model } from './domain/model';

export const createModelUseCase =
  (modelRepository: IModelRepository) =>
  async (request: CreateModelRequest): Promise<string> => {
    const model = Model.create({
      name: request.name,
      version: '1.0',
      modelGroupId: request.modelGroupId,
      connectorId: request.connectorId,
      description: request.description,
    });

    const modelId = await modelRepository.create(model);

    return modelId;
  };
