import { modelProviderConfigs } from '../../../../provider-model-config';
import { UseCases } from '../../../../setup';
import { CreateAgentDto } from '../../../agent/application/dtos/create-agent-dto';
import { AgentToolFactory } from '../../../agent/application/factories/agent-tool-factory';
import { AgentType } from '../../../agent/domain/enums/agent-type';
import { Tool } from '../../../agent/domain/enums/tool';
import {
  InstallationContext,
  InstallationAIAssistantStep,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class CreateAgentStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Create Agent' });
  }

  private createAgentDto(
    request: InstallAIDashboardAssistantDto,
    modelId: string,
  ): CreateAgentDto {
    return {
      name: request.agent.name,
      type: AgentType.CONVERSATIONAL,
      description: request.agent.description,
      model_id: modelId,
      response_filter:
        modelProviderConfigs[request.selected_provider]?.response_filter!,
      tools: [
        AgentToolFactory.create({
          type: Tool.ML_MODEL_TOOL,
          name: `${request.selected_provider}_${request.connector.model_id}_llm_model`,
          description: `A general-purpose language model tool capable of answering broad questions, summarizing information, and providing analysis that doesn't require searching specific data. Use this when no other specialized tool is applicable.`,
          parameters: {
            model_id: modelId,
            prompt: `Human: You're an Artificial intelligence analyst and you're going to help me with cybersecurity related tasks. Respond directly and concisely.

                  \${parameters.chat_history:-}

                  Human: \${parameters.question}

                  Assistant:`,
          },
        }),
        AgentToolFactory.create({
          type: Tool.SEARCH_INDEX_TOOL,
          name: 'WazuhAlertSearchTool',
          description: `Use this tool ONLY when asked to search for specific Wazuh alert data or summarize trends (e.g., 'most frequent', 'top types'). This tool queries the 'wazuh-alerts-*' daily indices. Provide a JSON string for the 'input' parameter. This JSON string MUST always include 'index' and a 'query' field. The 'query' field's value must be a JSON object that itself contains the OpenSearch 'query' DSL. Parameters like 'size', 'sort', and 'aggs' (aggregations) must be at the top level, alongside 'index' and 'query'. Remember: for Wazuh, the timestamp field is 'timestamp' and severity is 'rule.level'. Examples: \`{"index": "wazuh-alerts-*", "query": {"query": {"match_all": {}}}} \` --- For high-severity alerts (level 10 or higher) in the last 24 hours: \`{"index": "wazuh-alerts-*", "query": {"query": {"bool": {"filter": [{"range": {"timestamp": {"gte": "now-24h/h"}}}, {"range": {"rule.level": {"gte": 10}}}]}}}, "size": 10, "sort": [{"rule.level": {"order": "desc"}}, {"timestamp": {"order": "desc"}}] }\` --- To find the most frequent alert types in the last 24 hours, use this structure: \`{"index": "wazuh-alerts-*", "query": {"query": {"range": {"timestamp": {"gte": "now-24h/h"}}}}, "size": 0, "aggs": {"alert_types": {"terms": {"field": "rule.description.keyword", "size": 10}}}}} \` If specific agent names or rule IDs are requested, use a 'match' or 'term' query within the 'bool' filter alongside other conditions.`,
          parameters: {
            input: '${parameters.input}',
          },
        }),
      ],
    };
  }

  public async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    const agent = await UseCases.createAgent(
      this.createAgentDto(request, context.get('modelId')),
    );
    context.set('agentId', agent.id);
  }

  public getSuccessMessage(): string {
    return 'Agent created successfully';
  }

  public getFailureMessage(): string {
    return 'Failed to create agent. Please check the configuration and try again.';
  }
}
