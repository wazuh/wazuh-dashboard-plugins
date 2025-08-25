import type { InstallationError } from './installation-error';
import { InstallationProgress } from '../entities';

export interface InstallationResult {
  success: boolean;
  message: string;
  progress: InstallationProgress;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
    [key: string]: any;
  };
  errors?: InstallationError[];
}
