import { createAgentUseCase } from '../agent/create-agent';
import type { CreateAgentRequest } from '../agent/domain/types';
import { registerAgentUseCase } from '../agent/register-agent';
import { updateClusterSettingsUseCase } from '../cluster/update-cluster-settings';
import { createConnectorUseCase } from '../connector/create-connector';
import { createModelUseCase } from '../model/create-model';
import type { CreateModelRequest } from '../model/domain/types';
import { testModelConnectionUseCase } from '../model/test-model-connection';
import { InstallationContext } from './domain/installation-context';
import { InstallationProgressManager } from './domain/installation-progress-manager';
import {
  InstallDashboardAssistantRequest,
  InstallationProgress,
  InstallationResult,
  StepResultState,
} from './domain/types';
import { initializeRepositories } from './real-repositories';
import { IInstallationManager } from './types';

export class InstallationManager implements IInstallationManager {
  private repos: ReturnType<typeof initializeRepositories>;
  private progressCallback?: (progress: InstallationProgress) => void;

  constructor(progressCallback?: (progress: InstallationProgress) => void) {
    this.repos = initializeRepositories();
    this.progressCallback = progressCallback;
  }

  public async execute(
    request: InstallDashboardAssistantRequest,
  ): Promise<InstallationResult> {
    const stepNames = [
      'Update Cluster Settings',
      'Create Connector',
      'Create Model',
      'Test Model Connection',
      'Create Agent',
      'Register Agent',
    ];

    const progressManager = new InstallationProgressManager(
      stepNames,
      this.progressCallback,
    );
    const context = new InstallationContext();
    let currentStepIndex = 0;

    try {
      // Step 1: Update cluster settings
      progressManager.startStep(currentStepIndex);
      try {
        const updateClusterSettings = updateClusterSettingsUseCase(
          this.repos.clusterSettingsRepository,
        );
        await updateClusterSettings();
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Cluster settings updated successfully',
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.FAIL,
          'Failed to update cluster settings',
          undefined,
          error as Error,
        );
        throw error;
      }
      currentStepIndex++;

      // Step 2: Create connector
      progressManager.startStep(currentStepIndex);
      let connectorId: string;
      try {
        const createConnector = createConnectorUseCase(
          this.repos.connectorRepository,
        );
        connectorId = await createConnector(request.connector);
        context.set('connectorId', connectorId);
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Connector created successfully',
          { connectorId },
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.FAIL,
          'Failed to create connector',
          undefined,
          error as Error,
        );
        throw error;
      }
      currentStepIndex++;

      // Step 3: Create model
      progressManager.startStep(currentStepIndex);
      let modelId: string;
      try {
        const createModel = createModelUseCase(this.repos.modelRepository);
        const modelRequest: CreateModelRequest = {
          name: request.model.name,
          connectorId: connectorId,
          description: request.model.description,
          functionName: request.model.function_name,
        };
        modelId = await createModel(modelRequest);
        context.set('modelId', modelId);
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Model created successfully',
          { modelId },
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.FAIL,
          'Failed to create model',
          undefined,
          error as Error,
        );
        throw error;
      }
      currentStepIndex++;

      // Step 4: Test model connection
      progressManager.startStep(currentStepIndex);
      try {
        const testModelConnection = testModelConnectionUseCase(
          this.repos.modelRepository,
        );
        await testModelConnection({ modelId });
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Model connection tested successfully',
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.WARNING,
          'Model connection test failed, but continuing installation',
          undefined,
          error as Error,
        );
        // Continue with installation even if test fails
      }
      currentStepIndex++;

      // Step 5: Create agent
      progressManager.startStep(currentStepIndex);
      let agentId: string;
      try {
        const createAgent = createAgentUseCase(this.repos.agentRepository);
        const agentRequest: CreateAgentRequest = {
          name: request.agent.name,
          description: request.agent.description,
          modelId: modelId,
        };
        agentId = await createAgent(agentRequest);
        context.set('agentId', agentId);
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Agent created successfully',
          { agentId },
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.FAIL,
          'Failed to create agent',
          undefined,
          error as Error,
        );
        throw error;
      }
      currentStepIndex++;

      // Step 6: Register agent
      progressManager.startStep(currentStepIndex);
      try {
        const registerAgent = registerAgentUseCase(this.repos.agentRepository);
        await registerAgent({ agentId });
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.SUCCESS,
          'Agent registered successfully',
        );
      } catch (error) {
        progressManager.completeStep(
          currentStepIndex,
          StepResultState.FAIL,
          'Failed to register agent',
          undefined,
          error as Error,
        );
        throw error;
      }

      return {
        success: true,
        message: 'Dashboard Assistant installed successfully',
        progress: progressManager.getProgress(),
        data: {
          agentId: context.get('agentId'),
        },
      };
    } catch (error) {
      const failedSteps = progressManager.getFailedSteps();
      return {
        success: false,
        message: `Installation failed: ${error}`,
        progress: progressManager.getProgress(),
        errors: failedSteps.map(step => ({
          step: step.stepName,
          message: step.message || 'Unknown error',
          details: step.error,
        })),
      };
    }
  }
}
