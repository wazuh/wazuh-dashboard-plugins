import {
  IInstallationManager,
  InstallAIDashboardAssistantDto,
  InstallationProgress,
  InstallationResult,
  InstallationAIAssistantStep,
} from '../domain';
import { InstallationContext } from '../domain';
import { InstallationProgressManager } from '../domain';
import { CreateAgentStep } from './steps/create-agent-step';
import { CreateConnectorStep } from './steps/create-connector-step';
import { CreateModelStep } from './steps/create-model-step';
import { RegisterAgentStep } from './steps/register-agent-step';
import { TestModelConnectionStep } from './steps/test-model-connection-step';
import { UpdateMlCommonsSettingsStep } from './steps/update-ml-commons-settings-step';

export class InstallationManager implements IInstallationManager {
  constructor(
    private onInstallationProgress?: (progress: InstallationProgress) => void,
  ) {}

  public async execute(
    request: InstallAIDashboardAssistantDto,
  ): Promise<InstallationResult> {
    const steps: InstallationAIAssistantStep[] = [
      new UpdateMlCommonsSettingsStep(),
      new CreateConnectorStep(),
      new CreateModelStep(),
      new TestModelConnectionStep(),
      new CreateAgentStep(),
      new RegisterAgentStep(),
    ];

    const progressManager = new InstallationProgressManager(
      steps,
      this.onInstallationProgress,
    );
    const context = new InstallationContext();
    try {
      for (const step of steps) {
        await progressManager.runStep(step, () =>
          step.execute(request, context),
        );
      }

      return {
        success: true,
        message: 'Dashboard assistant installed successfully',
        progress: progressManager.getProgress(),
        data: context.toObject(),
      };
    } catch (error) {
      const progress = progressManager.getProgress();
      const failedSteps = progress.getFailedSteps();
      return {
        success: false,
        message: `Installation failed: ${error}`,
        progress,
        data: context.toObject(),
        errors: failedSteps.map(step => ({
          step: step.stepName,
          message: step.message || 'Unknown error',
          details: step.error,
        })),
      };
    }
  }
}
