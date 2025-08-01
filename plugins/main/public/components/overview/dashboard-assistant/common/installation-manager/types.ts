import type { InstallationContext } from './domain/installation-context';
import type {
  InstallDashboardAssistantRequest,
  InstallationResult,
} from './domain/types';

// Define local interfaces for installation manager
export interface IInstallationStep {
  getName(): string;
  execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void>;
}

export interface IInstallationManager {
  execute(
    request: InstallDashboardAssistantRequest,
  ): Promise<InstallationResult>;
}

// Re-export domain types
export type {
  InstallDashboardAssistantRequest,
  InstallationResult,
  InstallationContext,
};

// For compatibility with assistant-manager
export interface InstallDashboardAssistantResponse {
  success: boolean;
  message: string;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
  };
}
