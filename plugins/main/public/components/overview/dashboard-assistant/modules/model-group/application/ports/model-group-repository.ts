import {
  CreateRepository,
  DeleteRepository,
} from '../../../common/domain/entities/repository';
import { ModelGroup } from '../../domain/entities/model-group';
import { CreateModelGroupDto } from '../dtos/create-model-group-dto';

export interface ModelGroupRepository
  extends CreateRepository<ModelGroup, CreateModelGroupDto>,
    DeleteRepository {}
