import type { 
  InstallDashboardAssistantRequest, 
  IInstallationManager
} from './domain/types';
import { InstallDashboardAssistantResponse } from './domain/types';

export class InstallDashboardAssistantUseCase {
  constructor(
    private readonly installationManager: IInstallationManager
  ) {}

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallDashboardAssistantResponse> {
    try {
      const result = await this.installationManager.execute(request);
      
      return InstallDashboardAssistantResponse.success(result.agentId);
    } catch (error) {
      return InstallDashboardAssistantResponse.failure(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}