import { CreateConnectorDto } from '../../../modules/connector/application/dtos/create-connector-dto';
import { ProviderModelConfig } from '../../../provider-model-config';
import { CreateAgentDto } from '../../agent/application/dtos/create-agent-dto';
import { CreateMLCommonsDto } from '../../ml-commons-settings/application/dtos/create-ml-commons-dto';
import { CreateModelDto } from '../../model/application/dtos/create-model-dto';
import { InstallationContext } from './entities';
import { StepExecutionState, StepResultState } from './enums';

export interface IInstallationManager {
  execute(request: InstallAIDashboardAssistantDto): Promise<InstallationResult>;
}

export interface InstallAIDashboardAssistantDto {
  selected_provider: string;
  ml_common_settings: CreateMLCommonsDto;
  connector: CreateConnectorDto;
  model: Pick<CreateModelDto, 'name' | 'description'>;
  agent: Pick<CreateAgentDto, 'name' | 'description'>;
}

export interface StepState {
  stepName: string;
  executionState: StepExecutionState;
  resultState?: StepResultState;
  message?: string;
  error?: Error;
}

export interface InstallationProgress {
  currentStep: number;
  totalSteps: number;
  steps: StepState[];
  progressGlobalState: StepExecutionState;
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
export abstract class InstallationAIAssistantStep {
  protected name: string;

  constructor(params: { name: string }) {
    this.name = params.name;
  }

  getName(): string {
    return this.name;
  }
  abstract execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void>;
  abstract getSuccessMessage(): string;
  abstract getFailureMessage(): string;
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
    progress?: InstallationProgress,
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
