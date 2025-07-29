import type { 
  InstallDashboardAssistantRequest, 
  IInstallationManager
} from './domain/types';
import { InstallDashboardAssistantResponse } from './domain/types';

export const installDashboardAssistantUseCase = (installationManager: IInstallationManager) => async (request: InstallDashboardAssistantRequest): Promise<InstallDashboardAssistantResponse> => {
  try {
    const result = await installationManager.execute(request);
    
    return InstallDashboardAssistantResponse.success(result.agentId);
  } catch (error) {
    return InstallDashboardAssistantResponse.failure(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}