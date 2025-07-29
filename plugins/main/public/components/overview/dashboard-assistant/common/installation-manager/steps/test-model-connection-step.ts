import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { TestModelConnectionUseCase } from '../../model/test-model-connection';

export class TestModelConnectionStep implements IInstallationStep {
  constructor(private readonly testModelConnectionUseCase: TestModelConnectionUseCase) {}

  public getName(): string {
    return 'Test Model Connection';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    await this.testModelConnectionUseCase.execute({
      modelId: context.get<string>('modelId')!
    });
  }
}