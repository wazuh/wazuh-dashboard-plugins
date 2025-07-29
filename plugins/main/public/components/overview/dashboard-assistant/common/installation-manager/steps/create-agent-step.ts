import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { CreateAgentUseCase } from '../../agent/create-agent';

export class CreateAgentStep implements IInstallationStep {
  constructor(private readonly createAgentUseCase: CreateAgentUseCase) {}

  public getName(): string {
    return 'Create Agent';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    const agentId = await this.createAgentUseCase.execute({
      name: request.agent.name,
      description: request.agent.description,
      modelId: context.get<string>('modelId')!
    });
    
    context.set('agentId', agentId);
  }
}