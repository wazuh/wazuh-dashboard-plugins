import { InstallationContext } from './installation-context';

export interface IHttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
}

export interface IInstallationManager {
  execute(
    request: InstallDashboardAssistantRequest,
  ): Promise<InstallationResult>;
}

export interface IInstallationStep {
  execute(context: InstallationContext): Promise<void>;
  rollback(context: InstallationContext): Promise<void>;
  getName(): string;
}

export interface InstallDashboardAssistantRequest {
  clusterSettings: {
    mlCommonsAgentFrameworkEnabled: boolean;
    onlyRunOnMlNode: boolean;
    ragPipelineFeatureEnabled: boolean;
    trustedConnectorEndpointsRegex: string[];
  };
  modelGroup: {
    name: string;
    description: string;
  };
  connector: {
    name: string;
    description: string;
    endpoint: string;
    model: string;
    apiKey: string;
  };
  model: {
    name: string;
    version: string;
    description: string;
  };
  agent: {
    name: string;
    description: string;
  };
}

export interface InstallationResult {
  success: boolean;
  message: string;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
  };
  errors?: InstallationError[];
}

export interface InstallationError {
  step: string;
  message: string;
  details?: any;
}

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
