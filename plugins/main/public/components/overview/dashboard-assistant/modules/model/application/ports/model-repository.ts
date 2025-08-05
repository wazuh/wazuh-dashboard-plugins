import {
  CreateRepository,
  DeleteRepository,
  GetAllRepository,
} from '../../../common/domain/repository';
import { Model } from '../../domain/entities/model';
import { ModelPredictResponse } from '../../domain/types';
import { CreateModelDto } from '../dtos/create-model-dto';

export interface ModelRepository
  extends CreateRepository<Model, CreateModelDto>,
    GetAllRepository<Model>,
    DeleteRepository {
  testConnection(modelId: string): Promise<ModelPredictResponse>;
  deploy(modelId: string, deploy: boolean): Promise<void>;
}
