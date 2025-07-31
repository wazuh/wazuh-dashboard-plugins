import { IModelRepository } from './domain/types';

/**
 * Use case for deleting a model.
 * First undeploys the model (deploy: false), then unregisters it.
 */
export class DeleteModelUseCase {
  constructor(private readonly modelRepository: IModelRepository) {}

  /**
   * Deletes a model by first undeploying it and then unregistering it.
   * @param modelId - The ID of the model to delete
   * @throws Error if the model is not found or if any operation fails
   */
  public async execute(modelId: string): Promise<void> {
    try {
      // Step 1: Undeploy the model (PUT with deploy: false)
      await this.modelRepository.deploy(modelId, false);
      
      // Step 2: Unregister the model (DELETE)
      await this.modelRepository.unregister(modelId);
    } catch (error) {
      console.error(`Error deleting model ${modelId}:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create a delete model use case
 * @param modelRepository - The model repository instance
 * @returns DeleteModelUseCase instance
 */
export const deleteModelUseCase = (modelRepository: IModelRepository) => {
  const useCase = new DeleteModelUseCase(modelRepository);
  return (modelId: string) => useCase.execute(modelId);
};