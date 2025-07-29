import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { createModelUseCase } from '../../model/create-model';
import type {
  IModelRepository,
  CreateModelRequest,
} from '../../model/domain/types';

export class CreateModelStep implements IInstallationStep {
  constructor(private readonly modelRepository: IModelRepository) {}

  public getName(): string {
    return 'Create Model';
  }

  public async execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void> {
    const createModel = createModelUseCase(this.modelRepository);
    const modelRequest: CreateModelRequest = {
      name: request.model.name,
      version: request.model.version || '1.0.0',
      modelGroupId: context.get<string>('modelGroupId')!,
      description: request.model.description,
      connectorId: context.get<string>('connectorId')!,
    };
    const modelId = await createModel(modelRequest);

    context.set('modelId', modelId);
  }
}
