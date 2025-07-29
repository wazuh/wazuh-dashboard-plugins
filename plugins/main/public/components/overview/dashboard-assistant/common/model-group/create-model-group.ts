import { IModelGroupRepository, CreateModelGroupRequest } from './domain/types';
import { ModelGroup } from './domain/model-group';
import { ILogger } from '../installation-manager/domain/types';

export class CreateModelGroupUseCase {
  constructor(
    private readonly modelGroupRepository: IModelGroupRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: CreateModelGroupRequest): Promise<string> {
    this.logger.info(`Creating model group: ${request.name}`);
    
    const modelGroup = ModelGroup.create(request.name, request.description);
    const modelGroupId = await this.modelGroupRepository.create(modelGroup);
    
    this.logger.info(`Model group created with ID: ${modelGroupId}`);
    return modelGroupId;
  }
}