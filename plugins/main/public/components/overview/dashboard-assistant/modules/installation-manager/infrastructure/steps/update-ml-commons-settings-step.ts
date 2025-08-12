import { UseCases } from '../../../../setup';
import { modelProviderConfigs } from '../../../../provider-model-config';
import { CreateMLCommonsDto } from '../../../ml-commons-settings/application/dtos/create-ml-commons-dto';
import {
  InstallationAIAssistantStep,
  InstallationContext,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class UpdateMlCommonsSettingsStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Update ML Commons Settings' });
  }

  private buildDto(
    request: InstallAIDashboardAssistantDto,
  ): CreateMLCommonsDto {
    const provider = modelProviderConfigs[request.selected_provider];
    if (!provider) {
      throw new Error(
        `Unknown provider: ${request.selected_provider}. Please review configuration.`,
      );
    }
    const endpoints_regex = [provider.default_endpoint_regex || '.*'];
    return { endpoints_regex };
  }

  async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    const dto = this.buildDto(request);
    await UseCases.persistMlCommonsSettings(dto);
  }

  getSuccessMessage(): string {
    return 'ML Commons settings have been updated successfully';
  }

  getFailureMessage(): string {
    return 'Failed to update ML Commons settings. Please check the configuration and try again.';
  }
}
