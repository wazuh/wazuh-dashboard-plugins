import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { createModelGroupUseCase } from '../../model-group/create-model-group';
import type { IModelGroupRepository } from '../../model-group/domain/types';

export class CreateModelGroupStep implements IInstallationStep {
  constructor(private readonly modelGroupRepository: IModelGroupRepository) {}

  public getName(): string {
    return 'Create Model Group';
  }

  public async execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void> {
    const createModelGroup = createModelGroupUseCase(this.modelGroupRepository);
    const modelGroupId = await createModelGroup({
      name: request.modelGroup.name,
      description: request.modelGroup.description,
    });

    context.set('modelGroupId', modelGroupId);
  }
}
