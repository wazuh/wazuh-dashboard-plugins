// Model Group Domain Types

import { ModelGroup } from './model-group';

// Repository Interface
export interface IModelGroupRepository {
  create(modelGroup: ModelGroup): Promise<string>;
  findById(id: string): Promise<ModelGroup | null>;
  update(id: string, modelGroup: ModelGroup): Promise<void>;
  delete(id: string): Promise<void>;
}

// DTOs
export interface CreateModelGroupRequest {
  name: string;
  description: string;
}