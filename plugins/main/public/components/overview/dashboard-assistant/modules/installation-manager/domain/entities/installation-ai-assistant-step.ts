import type { InstallationContext } from './installation-context';
import type { InstallAIDashboardAssistantDto } from '../types/install-ai-dashboard-assistant-dto';

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
