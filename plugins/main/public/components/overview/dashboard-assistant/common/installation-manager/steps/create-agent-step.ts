import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { createAgentUseCase } from '../../agent/create-agent';
import type { IAgentRepository } from '../../agent/domain/types';

export class CreateAgentStep implements IInstallationStep {
  constructor(private readonly agentRepository: IAgentRepository) {}

  public getName(): string {
    return 'Create Agent';
  }

  public async execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void> {
    const createAgent = createAgentUseCase(this.agentRepository);
    const agentId = await createAgent({
      name: request.agent.name,
      description: request.agent.description,
      modelId: context.get<string>('modelId')!,
    });

    context.set('agentId', agentId);
  }
}
