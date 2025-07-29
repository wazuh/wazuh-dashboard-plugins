import type { IModelRepository, TestModelConnectionRequest } from './domain/types';

export class TestModelConnectionUseCase {
  constructor(
    private readonly modelRepository: IModelRepository
  ) {}

  public async execute(request: TestModelConnectionRequest): Promise<void> {
    // Test the model connection
    await this.modelRepository.testConnection(request.modelId);
  }
}