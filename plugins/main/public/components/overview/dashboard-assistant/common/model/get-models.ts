import type { IModelRepository } from './domain/types';
import type { Model } from './domain/model';

export class GetModelsUseCase {
  constructor(
    private readonly modelRepository: IModelRepository
  ) {}

  public async execute(): Promise<Model[]> {
    try {
      const models = await this.modelRepository.getAll();
      
      return models;
    } catch (error) {
      throw error;
    }
  }
}