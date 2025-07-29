import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { createConnectorUseCase } from '../../connector/create-connector';
import type { IConnectorRepository } from '../../connector/domain/types';

export class CreateConnectorStep implements IInstallationStep {
  constructor(private readonly connectorRepository: IConnectorRepository) {}

  public getName(): string {
    return 'Create Connector';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const createConnector = createConnectorUseCase(this.connectorRepository);
    const connectorId = await createConnector({
      name: request.connector.name,
      description: request.connector.description,
      endpoint: request.connector.endpoint,
      model: request.connector.model,
      apiKey: request.connector.apiKey
    });
    
    context.set('connectorId', connectorId);
  }
}