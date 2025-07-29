import type { IModelGroupRepository } from './domain/types';
import type { CreateModelGroupRequest } from '../assistant-manager/domain/types';
import { ModelGroup } from './domain/model-group';



export const createModelGroupUseCase = (modelGroupRepository: IModelGroupRepository) => async (request: CreateModelGroupRequest): Promise<string> => {
  const modelGroup = ModelGroup.create(request.name, request.description);
  const modelGroupId = await modelGroupRepository.create(modelGroup);
  
  return modelGroupId;
}