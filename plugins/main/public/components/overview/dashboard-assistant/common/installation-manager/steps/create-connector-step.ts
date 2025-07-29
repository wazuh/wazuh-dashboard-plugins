import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { CreateConnectorUseCase } from '../../connector/create-connector';

export class CreateConnectorStep implements IInstallationStep {
  constructor(private readonly createConnectorUseCase: CreateConnectorUseCase) {}

  public getName(): string {
    return 'Create Connector';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const connectorId = await this.createConnectorUseCase.execute({
      name: request.connector.name,
      description: request.connector.description,
      endpoint: request.connector.endpoint,
      model: request.connector.model,
      apiKey: request.connector.apiKey
    });
    
    context.set('connectorId', connectorId);
  }
}