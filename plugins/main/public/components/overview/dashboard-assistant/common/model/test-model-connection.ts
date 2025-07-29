import type { IModelRepository, TestModelConnectionRequest } from './domain/types';



export const testModelConnectionUseCase = (modelRepository: IModelRepository) => async (request: TestModelConnectionRequest): Promise<void> => {
  // Test the model connection
  await modelRepository.testConnection(request.modelId);
}