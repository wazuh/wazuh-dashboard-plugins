import { IInstallationManager, InstallDashboardAssistantRequest, InstallDashboardAssistantResponse } from './domain/types';

export class InstallDashboardAssistantUseCase {
  constructor(
    private readonly installationOrchestrator: IInstallationManager
  ) {}

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallDashboardAssistantResponse> {
    try {
      const result = await this.installationOrchestrator.execute(request);
      
      return {
        success: true,
        message: 'Dashboard Assistant installed successfully',
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}