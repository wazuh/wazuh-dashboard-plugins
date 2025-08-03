import {
  IInstallationManager,
  InstallDashboardAssistantRequest,
  IInstallDashboardAssistantResponse,
} from '../domain/types';

export const installDashboardAssistantUseCase =
  (installationOrchestrator: IInstallationManager) =>
  async (
    request: InstallDashboardAssistantRequest,
  ): Promise<IInstallDashboardAssistantResponse> => {
    try {
      const result = await installationOrchestrator.execute(request);

      return {
        success: true,
        message: 'Dashboard Assistant installed successfully',
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };
