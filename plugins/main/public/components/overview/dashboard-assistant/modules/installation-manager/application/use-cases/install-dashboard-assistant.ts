import {
  IInstallationManager,
  InstallAIDashboardAssistantDto,
  IInstallDashboardAssistantResponse,
} from '../../domain';

export const installDashboardAssistantUseCase =
  (installationOrchestrator: IInstallationManager) =>
  async (
    request: InstallAIDashboardAssistantDto,
  ): Promise<IInstallDashboardAssistantResponse> => {
    try {
      const result = await installationOrchestrator.execute(request);

      return {
        success: true,
        message: 'Dashboard assistant installed successfully',
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
