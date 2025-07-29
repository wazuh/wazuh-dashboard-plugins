import type { IModelRepository } from './domain/types';
import type { ILogger } from '../installation-manager/domain/types';
import { Model } from './domain/model';

export class GetModelsUseCase {
  constructor(
    private readonly modelRepository: IModelRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<Model[]> {
    try {
      this.logger.info('Getting all models');
      
      const models = await this.modelRepository.getAll();
      
      this.logger.info(`Successfully retrieved ${models.length} models`);
      return models;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Failed to get models: ${errorMessage}`);
      throw error;
    }
  }
}