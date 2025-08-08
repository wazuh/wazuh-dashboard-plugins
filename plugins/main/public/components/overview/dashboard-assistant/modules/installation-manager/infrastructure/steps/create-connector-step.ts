import { UseCases } from '../../../../setup';
import {
  InstallationContext,
  InstallationAIAssistantStep,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class CreateConnectorStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Create Connector' });
  }

  async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    const connector = await UseCases.createConnector(request.connector);
    context.set('connectorId', connector.id);
  }

  getSuccessMessage(): string {
    return 'Connector created successfully';
  }

  getFailureMessage(): string {
    return 'Failed to create connector. Please check the configuration and try again.';
  }
}
