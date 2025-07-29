import { IInstallationManager } from './types';
import { InstallDashboardAssistantRequest, InstallationResult } from './domain/types';
import { InstallationContext } from './domain/installation-context';
import { updateClusterSettingsUseCase } from '../cluster/update-cluster-settings';
import { createModelGroupUseCase } from '../model-group/create-model-group';
import { createConnectorUseCase } from '../connector/create-connector';
import { createModelUseCase } from '../model/create-model';
import { testModelConnectionUseCase } from '../model/test-model-connection';
import { createAgentUseCase } from '../agent/create-agent';
import { registerAgentUseCase } from '../agent/register-agent';
import { createMockRepositories } from './infrastructure/mock-repositories';
import type { IClusterSettingsRepository } from '../cluster/domain/types';
import type { IModelGroupRepository, CreateModelGroupRequest } from '../model-group/domain/types';
import type { IConnectorRepository, CreateConnectorRequest } from '../connector/domain/types';
import type { IModelRepository, CreateModelRequest, TestModelConnectionRequest } from '../model/domain/types';
import type { IAgentRepository, CreateAgentRequest, RegisterAgentRequest } from '../agent/domain/types';
import { ClusterSettings } from '../cluster/domain/cluster-settings';
import { ModelGroup } from '../model-group/domain/model-group';
import { Connector } from '../connector/domain/connector';
import { Model } from '../model/domain/model';
import { Agent } from '../agent/domain/agent';

export class InstallationManager implements IInstallationManager {
  private readonly mockRepos = createMockRepositories();

  public async execute(request: InstallDashboardAssistantRequest): Promise<InstallationResult> {
    const context = new InstallationContext();
    
    try {
      // Step 1: Update cluster settings
      const updateClusterSettings = updateClusterSettingsUseCase(this.mockRepos.clusterSettingsRepository);
      await updateClusterSettings();
      
      // Step 2: Create model group
      const createModelGroup = createModelGroupUseCase(this.mockRepos.modelGroupRepository);
      const modelGroupId = await createModelGroup(request.modelGroup);
      context.set('modelGroupId', modelGroupId);
      
      // Step 3: Create connector
      const createConnector = createConnectorUseCase(this.mockRepos.connectorRepository);
      const connectorId = await createConnector(request.connector);
      context.set('connectorId', connectorId);
      
      // Step 4: Create model
      const createModel = createModelUseCase(this.mockRepos.modelRepository);
      const modelRequest: CreateModelRequest = {
        name: request.model.name,
        modelGroupId: modelGroupId,
        connectorId: connectorId,
        description: request.model.description,
        version: request.model.version || '1.0.0'
      };
      const modelId = await createModel(modelRequest);
      context.set('modelId', modelId);
      
      // Step 5: Test model connection
      const testModelConnection = testModelConnectionUseCase(this.mockRepos.modelRepository);
      await testModelConnection({ modelId });
      
      // Step 6: Create agent
      const createAgent = createAgentUseCase(this.mockRepos.agentRepository);
      const agentRequest: CreateAgentRequest = {
        name: request.agent.name,
        description: request.agent.description,
        modelId: modelId
      };
      const agentId = await createAgent(agentRequest);
      context.set('agentId', agentId);
      
      // Step 7: Register agent
      const registerAgent = registerAgentUseCase(this.mockRepos.agentRepository);
      await registerAgent({ agentId });
      
      return {
        success: true,
        message: 'Installation completed successfully',
        data: {
          agentId: context.get<string>('agentId')
        }
      };
    } catch (error) {
      throw new Error(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}