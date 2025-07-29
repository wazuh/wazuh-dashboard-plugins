import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { CreateModelGroupUseCase } from '../../model-group/create-model-group';

export class CreateModelGroupStep implements IInstallationStep {
  constructor(private readonly createModelGroupUseCase: CreateModelGroupUseCase) {}

  public getName(): string {
    return 'Create Model Group';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const modelGroupId = await this.createModelGroupUseCase.execute({
      name: request.modelGroup.name,
      description: request.modelGroup.description
    });
    
    context.set('modelGroupId', modelGroupId);
  }
}