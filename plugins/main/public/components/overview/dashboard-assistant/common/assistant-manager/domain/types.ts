// Infrastructure Interfaces
export interface IHttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
}



export interface IInstallationManager {
  execute(request: InstallDashboardAssistantRequest): Promise<InstallationResult>;
}

export interface IInstallationStep {
  getName(): string;
  execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void>;
}

export interface InstallDashboardAssistantRequest {
  modelName: string;
  modelVersion: string;
  apiUrl: string;
  apiKey: string;
  description?: string;
}

export interface CreateModelGroupRequest {
  name: string;
  description: string;
}

export interface CreateConnectorRequest {
  name: string;
  description: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface CreateModelRequest {
  name: string;
  modelGroupId: string;
  description: string;
  connectorId: string;
}

export interface TestModelConnectionRequest {
  modelId: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  modelId: string;
}

export interface RegisterAgentRequest {
  agentId: string;
}

export class InstallationResult {
  constructor(public readonly agentId: string) {}
}

export interface InstallationError {
  message: string;
  cause?: Error;
}

export class InstallDashboardAssistantResponse {
  private constructor(
    public readonly success: boolean,
    public readonly agentId?: string,
    public readonly error?: string
  ) {}

  public static success(agentId: string): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse(true, agentId);
  }

  public static failure(error: string): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse(false, undefined, error);
  }
}

import type { InstallationContext } from '../../installation-manager/domain/installation-context';
export type { InstallationContext };