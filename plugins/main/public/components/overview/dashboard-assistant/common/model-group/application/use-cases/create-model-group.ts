import { CreateModelGroupDto } from '../dtos/create-model-group-dto';
import type { IModelGroupRepository } from '../ports/model-group-repository';

export const createModelGroupUseCase =
  (modelGroupRepository: IModelGroupRepository) =>
  async (modelGroupDto: CreateModelGroupDto) => {
    const modelGroup = await modelGroupRepository.create(modelGroupDto);

    return modelGroup;
  };
