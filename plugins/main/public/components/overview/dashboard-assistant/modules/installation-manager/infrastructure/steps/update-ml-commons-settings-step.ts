import { UseCases } from '../../../../setup';
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
    await UseCases.persistMlCommonsSettings(request.ml_common_settings);
  }

  getSuccessMessage(): string {
    return 'ML Commons settings have been updated successfully';
  }

  getFailureMessage(): string {
    return 'Failed to update ML Commons settings. Please check the configuration and try again.';
  }
}
