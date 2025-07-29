import { IInstallationManager, ILogger, InstallDashboardAssistantRequest, InstallDashboardAssistantResponse } from '../installation-manager/domain/types';

export class InstallDashboardAssistantUseCase {
  constructor(
    private readonly installationOrchestrator: IInstallationManager,
    private readonly logger: ILogger
  ) {}

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallDashboardAssistantResponse> {
    try {
      this.logger.info('Starting Dashboard Assistant installation');
      
      const result = await this.installationOrchestrator.execute(request);
      
      this.logger.info('Dashboard Assistant installation completed successfully');
      return {
        success: true,
        message: 'Dashboard Assistant installed successfully',
        data: result.data
      };
    } catch (error) {
      this.logger.error('Dashboard Assistant installation failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }
}