import { IModelRepository, TestModelConnectionRequest } from './domain/types';
import { ILogger } from '../installation-manager/domain/types';

export class TestModelConnectionUseCase {
  constructor(
    private readonly modelRepository: IModelRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: TestModelConnectionRequest): Promise<any> {
    this.logger.info(`Testing model connection for model ID: ${request.modelId}`);
    
    const result = await this.modelRepository.testConnection(request.modelId);
    
    this.logger.info('Model connection test completed successfully');
    return result;
  }
}