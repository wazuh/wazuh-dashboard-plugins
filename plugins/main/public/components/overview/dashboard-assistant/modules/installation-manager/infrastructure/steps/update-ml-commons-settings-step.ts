import { UseCases } from '../../../../setup';
import { modelProviderConfigs } from '../../../../provider-model-config';
import { buildCreateMLCommonsDto } from '../../../ml-commons-settings/application/dtos/create-ml-commons-dto';
import {
  InstallationAIAssistantStep,
  InstallationContext,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class UpdateMlCommonsSettingsStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Update ML Commons Settings' });
  }

  async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    const provider = modelProviderConfigs[request.selected_provider];
    const endpoints_regex = [provider?.default_endpoint_regex || '.*'];
    const dto = buildCreateMLCommonsDto(endpoints_regex);
    await UseCases.persistMlCommonsSettings(dto);
  }

  getSuccessMessage(): string {
    return 'ML Commons settings have been updated successfully';
  }

  getFailureMessage(): string {
    return 'Failed to update ML Commons settings. Please check the configuration and try again.';
  }
}
