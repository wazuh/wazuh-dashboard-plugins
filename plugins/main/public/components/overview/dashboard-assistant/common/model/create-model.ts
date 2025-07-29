import { IModelRepository, CreateModelRequest } from './domain/types';
import { Model } from './domain/model';
import { ILogger } from '../installation-manager/domain/types';

export class CreateModelUseCase {
  constructor(
    private readonly modelRepository: IModelRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: CreateModelRequest): Promise<string> {
    this.logger.info(`Creating model: ${request.name}`);
    
    const model = Model.create({
      name: request.name,
      version: request.version,
      modelGroupId: request.modelGroupId,
      connectorId: request.connectorId,
      description: request.description
    });
    
    const modelId = await this.modelRepository.create(model);
    
    this.logger.info(`Model created with ID: ${modelId}`);
    return modelId;
  }
}