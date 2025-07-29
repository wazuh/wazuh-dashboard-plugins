import type { IModelRepository } from './domain/types';
import type { CreateModelRequest } from '../assistant-manager/domain/types';
import { Model } from './domain/model';

export class CreateModelUseCase {
  constructor(
    private readonly modelRepository: IModelRepository
  ) {}

  public async execute(request: CreateModelRequest): Promise<string> {
    const model = Model.create({
      name: request.name,
      version: '1.0',
      modelGroupId: request.modelGroupId,
      connectorId: request.connectorId,
      description: request.description
    });
    
    const modelId = await this.modelRepository.create(model);
    
    return modelId;
  }
}