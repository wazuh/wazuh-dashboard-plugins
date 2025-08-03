import { ProviderModelConfig } from '../../../provider-model-config';
import { CreateConnectorDto } from '../../connector/application/dtos/create-connector-dto';
import { Connector } from '../../connector/domain/entities/connector';
import { InstallationContext } from './installation-context';

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
  connector: CreateConnectorDto;
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

export interface StepState {
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
  steps: StepState[];
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
  modelId: string;
  model: ProviderModelConfig;
  apiKey: string;
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

// Define local interfaces for installation manager
export interface IInstallationStep {
  getName(): string;
  execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void>;
}

// For compatibility with assistant-manager
export interface IInstallDashboardAssistantResponse {
  success: boolean;
  message: string;
  data?: {
    modelGroupId?: string;
    connectorId?: string;
    modelId?: string;
    agentId?: string;
  };
}

export class InstallDashboardAssistantResponse
  implements IInstallDashboardAssistantResponse
{
  private constructor(
    readonly success: boolean,
    readonly message: string,
    readonly progress?: InstallationProgress,
    readonly agentId?: string,
    readonly error?: string,
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
