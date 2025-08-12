import type {
  InstallAIDashboardAssistantDto,
  InstallationResult,
} from '../types';

export interface IInstallationManager {
  execute(request: InstallAIDashboardAssistantDto): Promise<InstallationResult>;
}
