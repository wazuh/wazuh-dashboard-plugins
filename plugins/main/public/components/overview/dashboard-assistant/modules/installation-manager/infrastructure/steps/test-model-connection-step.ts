import { UseCases } from '../../../../setup';
import {
  InstallationContext,
  InstallationAIAssistantStep,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class TestModelConnectionStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Test Model Connection' });
  }

  public async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    // Simulate testing model connection
    const isConnected = await UseCases.testModelConnection(
      context.get('modelId'),
    );
    if (!isConnected) {
      throw new Error('Failed to connect to model');
    }
  }

  public getSuccessMessage(): string {
    return 'Model connection tested successfully';
  }

  public getFailureMessage(): string {
    return 'Failed to test model connection. Please check the model configuration and try again.';
  }
}
