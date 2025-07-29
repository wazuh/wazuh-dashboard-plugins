import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { RegisterAgentUseCase } from '../../agent/register-agent';

export class RegisterAgentStep implements IInstallationStep {
  constructor(private readonly registerAgentUseCase: RegisterAgentUseCase) {}

  public getName(): string {
    return 'Register Agent';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    await this.registerAgentUseCase.execute({
      agentId: context.get<string>('agentId')!
    });
  }
}