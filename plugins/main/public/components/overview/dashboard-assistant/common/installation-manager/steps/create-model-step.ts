import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { CreateModelUseCase } from '../../model/create-model';

export class CreateModelStep implements IInstallationStep {
  constructor(private readonly createModelUseCase: CreateModelUseCase) {}

  public getName(): string {
    return 'Create Model';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const modelId = await this.createModelUseCase.execute({
      name: request.model.name,
      version: request.model.version,
      modelGroupId: context.get<string>('modelGroupId')!,
      description: request.model.description,
      connectorId: context.get<string>('connectorId')!
    });
    
    context.set('modelId', modelId);
  }
}