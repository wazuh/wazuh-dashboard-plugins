import type { IModelGroupRepository } from './domain/types';
import type { CreateModelGroupRequest } from '../assistant-manager/domain/types';
import { ModelGroup } from './domain/model-group';

export class CreateModelGroupUseCase {
  constructor(
    private readonly modelGroupRepository: IModelGroupRepository
  ) {}

  public async execute(request: CreateModelGroupRequest): Promise<string> {
    const modelGroup = ModelGroup.create(request.name, request.description);
    const modelGroupId = await this.modelGroupRepository.create(modelGroup);
    
    return modelGroupId;
  }
}