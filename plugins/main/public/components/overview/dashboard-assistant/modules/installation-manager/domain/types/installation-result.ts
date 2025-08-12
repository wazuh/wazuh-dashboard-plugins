import type { InstallationProgress } from './installation-progress';
import type { InstallationError } from './installation-error';

export interface InstallationResult {
  success: boolean;
  message: string;
  progress: InstallationProgress;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
  };
  errors?: InstallationError[];
}
