import type {
  IModelRepository,
  TestModelConnectionRequest,
  ModelPredictResponse,
} from './domain/types';

export const testModelConnectionUseCase =
  (modelRepository: IModelRepository) =>
  async (request: TestModelConnectionRequest): Promise<ModelPredictResponse> => {
    // Test the model connection and return the response
    return await modelRepository.testConnection(request.modelId);
  };
