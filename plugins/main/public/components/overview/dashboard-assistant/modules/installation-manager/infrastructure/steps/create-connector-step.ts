import { UseCases } from '../../../../setup';
import { modelProviderConfigs } from '../../../../provider-model-config';
import { CreateConnectorDto } from '../../../connector/application/dtos/create-connector-dto';
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
    const provider = modelProviderConfigs[request.selected_provider];
    const connectorDto: CreateConnectorDto = {
      name: `${request.selected_provider} Chat Connector`,
      description: `Connector to ${request.selected_provider} model service for ${request.model_id}`,
      endpoint: request.api_url,
      model_id: request.model_id,
      api_key: request.api_key,
      url_path: provider.url_path,
      headers: provider.headers,
      request_body: provider.request_body,
      extra_parameters: provider.extra_parameters || {},
    };

    const connector = await UseCases.createConnector(connectorDto);
    context.set('connectorId', connector.id);
  }

  getSuccessMessage(): string {
    return 'Connector created successfully';
  }

  getFailureMessage(): string {
    return 'Failed to create connector. Please check the configuration and try again.';
  }
}
