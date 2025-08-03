import { CreateRepository } from '../../../domain/repository';
import { ModelGroup } from '../../domain/model-group';
import { CreateModelGroupDto } from '../dtos/create-model-group-dto';

export interface IModelGroupRepository
  extends CreateRepository<ModelGroup, CreateModelGroupDto> {}
