import { modelProviderConfigs } from '../../../../provider-model-config';
import { UseCases } from '../../../../setup';
import { CreateAgentDto } from '../../../agent/application/dtos/create-agent-dto';
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
    const response_filter =
      modelProviderConfigs[request.selected_provider]?.response_filter;
    if (!response_filter) {
      throw new Error(
        `Missing response_filter for provider ${request.selected_provider}`,
      );
    }
    return {
      name: `${request.selected_provider}_agent`,
      type: AgentType.CONVERSATIONAL,
      description: `AI agent powered by ${request.selected_provider}`,
      model_id: modelId,
      response_filter,
      tools: [
        {
          type: Tool.SEARCH_INDEX_TOOL,
          name: 'alerts',
          description: "Search Wazuh alerts",
          include_output_in_agent_response: false,
          config: {
            input: "{ \"index\": \"wazuh-alerts-*\", \"size\": 200, \"track_total_hits\": true, \"query\": { \"query\": { \"bool\": { \"must\": [ { \"query_string\": { \"query\": \"${parameters.llm_generated_input}\", \"lenient\": true, \"default_operator\": \"AND\", \"analyze_wildcard\": true, \"fields\": [ \"rule.description\", \"rule.id\", \"rule.level\", \"rule.groups\", \"agent.name\", \"agent.id\", \"agent.ip\", \"syscheck.event\", \"full_log\", \"decoder.name\", \"predecoder.program_name\", \"location\", \"input.type\", \"@timestamp\" ] } } ] } } } }"
          }
        },
        {
          type: Tool.SEARCH_INDEX_TOOL,
          name: 'vuls',
          description: "Search Wazuh vulnerabilities",
          include_output_in_agent_response: false,
          config: {
            input: "{ \"index\": \"wazuh-states-vulnerabilities-*\", \"size\": 10000, \"track_total_hits\": true, \"query\": { \"query\": { \"bool\": { \"must\": [ { \"query_string\": { \"query\": \"${parameters.llm_generated_input}\", \"lenient\": true, \"default_operator\": \"AND\", \"analyze_wildcard\": true, \"fields\": [ \"vulnerability.id\", \"vulnerability.severity\", \"package.name\", \"package.version\", \"agent.name\" ] } } ] } } } }"
          }
        },
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
