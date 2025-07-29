import type { 
  InstallDashboardAssistantRequest, 
  IInstallationManager,
  ILogger 
} from './domain/types';
import { InstallDashboardAssistantResponse } from './domain/types';

export class InstallDashboardAssistantUseCase {
  constructor(
    private readonly installationManager: IInstallationManager,
    private readonly logger: ILogger
  ) {}

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallDashboardAssistantResponse> {
    try {
      this.logger.info('Starting Dashboard Assistant installation');
      
      const result = await this.installationManager.execute(request);
      
      this.logger.info('Dashboard Assistant installation completed successfully');
      return InstallDashboardAssistantResponse.success(result.agentId);
    } catch (error) {
      this.logger.error('Dashboard Assistant installation failed', error as Error);
      return InstallDashboardAssistantResponse.failure((error as Error).message);
    }
  }
}