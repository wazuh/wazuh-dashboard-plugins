import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { registerAgentUseCase } from '../../agent/register-agent';
import type { IAgentRepository } from '../../agent/domain/types';

export class RegisterAgentStep implements IInstallationStep {
  constructor(private readonly agentRepository: IAgentRepository) {}

  public getName(): string {
    return 'Register Agent';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const registerAgent = registerAgentUseCase(this.agentRepository);
    await registerAgent({
      agentId: context.get<string>('agentId')!
    });
  }
}