// Compatibility barrel for legacy imports from './domain/types'
export type { InstallAIDashboardAssistantDto } from './types/install-ai-dashboard-assistant-dto';
export type { StepState } from './types/step-state';
export type { InstallationError } from './types/installation-error';
export type { InstallationResult } from './types/installation-result';
export type {
  CreateModelGroupRequest,
  CreateConnectorRequest,
  CreateAgentRequest,
  RegisterAgentRequest,
} from './types/requests';
export { InstallationAIAssistantStep } from './entities/installation-ai-assistant-step';
export { InstallDashboardAssistantResponse } from './entities/install-dashboard-assistant-response';
export type { IInstallDashboardAssistantResponse } from './entities/install-dashboard-assistant-response';
export type { IInstallationManager } from './interfaces/installation-manager';
