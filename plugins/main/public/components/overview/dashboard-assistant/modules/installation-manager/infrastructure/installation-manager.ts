import { UseCases } from '../../../setup';
import { InstallationContext } from '../domain/installation-context';
import { InstallationProgressManager } from '../domain/installation-progress-manager';
import {
  IInstallationManager,
  InstallDashboardAssistantRequest,
  InstallationProgress,
  InstallationResult,
  StepResultState,
} from '../domain/types';
import {
  buildCreateModelDto,
  CreateModelDto,
} from '../../model/application/dtos/create-model-dto';
import { AgentType } from '../../agent/domain/enums/agent-type';
import { CreateAgentDto } from '../../agent/application/dtos/create-agent-dto';
import { modelProviderConfigs } from '../../../provider-model-config';
import { Tool } from '../../agent/domain/enums/tool';

export class InstallationManager implements IInstallationManager {
  constructor(
    private progressCallback?: (progress: InstallationProgress) => void,
  ) {}

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
        await UseCases.persistMlCommonsSettings(request.ml_common_settings);
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

      // Step 2: Create a connector
      progressManager.startStep(currentStepIndex);
      let connectorId: string;
      try {
        connectorId =
          (await UseCases.createConnector(request.connector)).id || '';
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

      // Step 3: Create a model
      progressManager.startStep(currentStepIndex);
      let modelId: string;
      try {
        const createModelDto = buildCreateModelDto({
          ...request.model,
          connectorId,
        });
        modelId = (await UseCases.createModel(createModelDto)).id as string;
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
        await UseCases.testModelConnection(modelId);
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
        // Continue with installation even if the test fails
      }
      currentStepIndex++;

      // Step 5: Create an agent
      progressManager.startStep(currentStepIndex);
      let agentId: string;
      try {
        const agentRequest: CreateAgentDto = {
          name: request.agent.name,
          type: AgentType.CONVERSATIONAL,
          description: request.agent.description,
          llm: {
            model_id: modelId,
            parameters: {
              max_iterations: 5,
              stop_when_no_tool_found: true,
              response_filter:
                modelProviderConfigs[request.selected_provider]
                  ?.response_filter!,
            },
          },
          tools: [
            {
              type: Tool.ML_MODEL_TOOL,
              name: `${request.connector.model_config.model_provider}_${request.connector.model_id}_llm_model`,
              description: `A general-purpose language model tool capable of answering broad questions, summarizing information, and providing analysis that doesn't require searching specific data. Use this when no other specialized tool is applicable.`,
              parameters: {
                model_id: modelId,
                prompt: `Human: You're an Artificial intelligence analyst and you're going to help me with cybersecurity related tasks. Respond directly and concisely.

                  \${parameters.chat_history:-}

                  Human: \${parameters.question}

                  Assistant:`,
              },
            },
            {
              type: Tool.SEARCH_INDEX_TOOL,
              name: 'WazuhAlertSearchTool',
              description: `Use this tool ONLY when asked to search for specific Wazuh alert data or summarize trends (e.g., 'most frequent', 'top types'). This tool queries the 'wazuh-alerts-*' daily indices. Provide a JSON string for the 'input' parameter. This JSON string MUST always include 'index' and a 'query' field. The 'query' field's value must be a JSON object that itself contains the OpenSearch 'query' DSL. Parameters like 'size', 'sort', and 'aggs' (aggregations) must be at the top level, alongside 'index' and 'query'. Remember: for Wazuh, the timestamp field is 'timestamp' and severity is 'rule.level'. Examples: \`{"index": "wazuh-alerts-*", "query": {"query": {"match_all": {}}}} \` --- For high-severity alerts (level 10 or higher) in the last 24 hours: \`{"index": "wazuh-alerts-*", "query": {"query": {"bool": {"filter": [{"range": {"timestamp": {"gte": "now-24h/h"}}}, {"range": {"rule.level": {"gte": 10}}}]}}}, "size": 10, "sort": [{"rule.level": {"order": "desc"}}, {"timestamp": {"order": "desc"}}] }\` --- To find the most frequent alert types in the last 24 hours, use this structure: \`{"index": "wazuh-alerts-*", "query": {"query": {"range": {"timestamp": {"gte": "now-24h/h"}}}}, "size": 0, "aggs": {"alert_types": {"terms": {"field": "rule.description.keyword", "size": 10}}}}} \` If specific agent names or rule IDs are requested, use a 'match' or 'term' query within the 'bool' filter alongside other conditions.`,
              parameters: {
                input: '${parameters.input}',
              },
            },
          ],
        };
        agentId = (await UseCases.createAgent(agentRequest)).id || '';
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

      // Step 6: Register an agent
      progressManager.startStep(currentStepIndex);
      try {
        await UseCases.registerAgent(agentId);
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
