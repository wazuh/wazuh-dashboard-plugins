import { InstallationContext } from './installation-context';

interface HttpPostProxy {
  (url: string, data?: any, config?: Record<string, any>): Promise<any>; // Default return type
  put: (url: string, data?: any, config?: Record<string, any>) => Promise<any>;
  delete: (url: string, config?: Record<string, any>) => Promise<any>;
}

export interface IHttpClient {
  get<T = any>(url: string, config?: Record<string, any>): Promise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T>;
  delete<T = any>(url: string, config?: Record<string, any>): Promise<T>;
  proxyRequest: {
    get: (url: string, config?: Record<string, any>) => Promise<any>;
    post: HttpPostProxy;
    put: (
      url: string,
      data?: any,
      config?: Record<string, any>,
    ) => Promise<any>;
    delete: (url: string, config?: Record<string, any>) => Promise<any>;
  };
}

export interface IInstallationManager {
  execute(
    request: InstallDashboardAssistantRequest,
  ): Promise<InstallationResult>;
}

export interface IInstallationStep {
  getName(): string;
  execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void>;
}

export interface InstallDashboardAssistantRequest {
  clusterSettings: {
    mlCommonsAgentFrameworkEnabled: boolean;
    onlyRunOnMlNode: boolean;
    ragPipelineFeatureEnabled: boolean;
    trustedConnectorEndpointsRegex: string[];
  };
  modelGroup?: {
    // ModelGroup is created automatically if is not defined
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
    function_name: string;
    description: string;
  };
  agent: {
    name: string;
    description: string;
  };
}

// Step execution states
export enum StepExecutionState {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  FINISHED = 'finished',
}

// Step result states
export enum StepResultState {
  SUCCESS = 'success',
  FAIL = 'fail',
  WARNING = 'warning',
}

export interface StepStatus {
  stepName: string;
  executionState: StepExecutionState;
  resultState?: StepResultState;
  message?: string;
  error?: Error;
  startTime?: Date;
  endTime?: Date;
  data?: any;
}

export interface InstallationProgress {
  currentStep: number;
  totalSteps: number;
  steps: StepStatus[];
  overallState: StepExecutionState;
}

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

// Request DTOs
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
  modelGroupId?: string;
  description: string;
  connectorId: string;
  functionName: string;
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

export interface InstallationError {
  step: string;
  message: string;
  details?: any;
}

export class InstallDashboardAssistantResponse {
  private constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly progress: InstallationProgress,
    public readonly agentId?: string,
    public readonly error?: string,
  ) {}

  public static success(
    agentId: string,
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse(
      true,
      'Installation completed successfully',
      progress,
      agentId,
    );
  }

  public static failure(
    error: string,
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse(
      false,
      error,
      progress,
      undefined,
      error,
    );
  }

  public static inProgress(
    progress: InstallationProgress,
  ): InstallDashboardAssistantResponse {
    return new InstallDashboardAssistantResponse(
      false,
      'Installation in progress',
      progress,
    );
  }
}
