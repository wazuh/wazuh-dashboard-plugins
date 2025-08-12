import { StepExecutionState } from '../enums';
import type { InstallationProgress } from '../types/installation-progress';

export interface IInstallDashboardAssistantResponse {
  success: boolean;
  message: string;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
  };
}

export class InstallDashboardAssistantResponse
  implements IInstallDashboardAssistantResponse
{
  public success: boolean;
  public message: string;
  public progress: InstallationProgress;
  public data?: {
    agentId?: string;
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
  };
  public error?: string;

  private constructor(params: {
    success: boolean;
    message: string;
    progress: InstallationProgress;
    agentId?: string;
    error?: string;
  }) {
    this.success = params.success;
    this.message = params.message;
    this.progress = params.progress;
    this.data = {
      agentId: params.agentId,
    };
    this.error = params.error;
  }

  public static success(
    agentId: string,
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse({
      success: true,
      message: 'Installation completed successfully',
      progress,
      agentId,
    });
  }

  public static failure(
    error: string,
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse({
      success: false,
      message: error,
      progress,
      error,
    });
  }

  public static inProgress(
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse({
      success: false,
      message: 'Installation in progress',
      progress,
    });
  }

  static start(): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse({
      success: false,
      message: 'Installation started',
      progress: {
        currentStep: 0,
        totalSteps: 0,
        steps: [],
        progressGlobalState: StepExecutionState.PENDING,
      },
    });
  }
}
