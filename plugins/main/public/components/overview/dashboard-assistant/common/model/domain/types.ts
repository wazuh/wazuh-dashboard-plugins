import { Model } from './model';

export interface IModelRepository {
  create(model: Model): Promise<string>;
  findById(id: string): Promise<Model | null>;
  getAll(): Promise<Model[]>;
  update(id: string, model: Model): Promise<void>;
  delete(id: string): Promise<void>;
  testConnection(modelId: string): Promise<boolean>;
}

export interface CreateModelRequest {
  name: string;
  version: string;
  modelGroupId: string;
  connectorId: string;
  description: string;
}

export interface TestModelConnectionRequest {
  modelId: string;
}
