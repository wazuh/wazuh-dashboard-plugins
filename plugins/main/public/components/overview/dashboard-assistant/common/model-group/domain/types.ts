// Model Group Domain Types

import { Repository } from '../../domain/repository';
import { ModelGroup } from './model-group';

// Repository Interface
export interface IModelGroupRepository extends Repository<ModelGroup> {}

// DTOs
export interface CreateModelGroupRequest {
  name: string;
  description: string;
}
