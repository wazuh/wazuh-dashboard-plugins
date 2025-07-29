import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { testModelConnectionUseCase } from '../../model/test-model-connection';
import type { IModelRepository } from '../../model/domain/types';

export class TestModelConnectionStep implements IInstallationStep {
  constructor(private readonly modelRepository: IModelRepository) {}

  public getName(): string {
    return 'Test Model Connection';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const testModelConnection = testModelConnectionUseCase(this.modelRepository);
    await testModelConnection({
      modelId: context.get<string>('modelId')!
    });
  }
}