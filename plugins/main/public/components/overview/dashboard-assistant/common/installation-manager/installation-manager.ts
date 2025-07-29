import { IInstallationManager } from './types';
import { InstallDashboardAssistantRequest, InstallationResult } from './domain/types';
import { IInstallationStep } from '../assistant-manager/domain/types';
import { InstallationContext } from './domain/installation-context';
import { UpdateClusterSettingsUseCase } from '../cluster/update-cluster-settings';
import { CreateModelGroupUseCase } from '../model-group/create-model-group';
import { CreateConnectorUseCase } from '../connector/create-connector';
import { CreateModelUseCase } from '../model/create-model';
import { TestModelConnectionUseCase } from '../model/test-model-connection';
import { CreateAgentUseCase } from '../agent/create-agent';
import { RegisterAgentUseCase } from '../agent/register-agent';
import { UpdateClusterSettingsStep } from './steps/update-cluster-settings-step';
import { CreateModelGroupStep } from './steps/create-model-group-step';
import { CreateConnectorStep } from './steps/create-connector-step';
import { CreateModelStep } from './steps/create-model-step';
import { TestModelConnectionStep } from './steps/test-model-connection-step';
import { CreateAgentStep } from './steps/create-agent-step';
import { RegisterAgentStep } from './steps/register-agent-step';

// Installation Manager
export class InstallationManager implements IInstallationManager {
  private readonly steps: IInstallationStep[];

  constructor(
    updateClusterSettingsUseCase: UpdateClusterSettingsUseCase,
    createModelGroupUseCase: CreateModelGroupUseCase,
    createConnectorUseCase: CreateConnectorUseCase,
    createModelUseCase: CreateModelUseCase,
    testModelConnectionUseCase: TestModelConnectionUseCase,
    createAgentUseCase: CreateAgentUseCase,
    registerAgentUseCase: RegisterAgentUseCase
  ) {
    this.steps = [
      new UpdateClusterSettingsStep(updateClusterSettingsUseCase),
      new CreateModelGroupStep(createModelGroupUseCase),
      new CreateConnectorStep(createConnectorUseCase),
      new CreateModelStep(createModelUseCase),
      new TestModelConnectionStep(testModelConnectionUseCase),
      new CreateAgentStep(createAgentUseCase),
      new RegisterAgentStep(registerAgentUseCase)
    ];
  }

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallationResult> {
    const context = new InstallationContext();
    
    for (const step of this.steps) {
      try {
        await step.execute(request, context);
      } catch (error) {
        throw new Error(`Installation failed at step: ${step.getName()}`);
      }
    }

    return {
      success: true,
      message: 'Installation completed successfully',
      data: {
        agentId: context.get<string>('agentId')
      }
    };
  }
}